import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  applyRefreshedTokens,
  clearSessionStorage,
} from "../store/sessionStorage";

// VITE_API_BASE_URL is the bare origin (e.g. https://api.glasspay.app) —
// /api/v1 must always be appended, with or without the env var set.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const client = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Attach JWT to every request ───────────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh-token single-flight ─────────────────────────────────────────────
// One shared promise per refresh cycle: the first 401 to arrive creates it,
// concurrent 401s await the same promise instead of firing their own
// refresh calls. The promise is cleared in `finally` so the next expiry
// cycle starts fresh. Backend contract is unchanged:
// POST /api/v1/auth/token/refresh — body: { refreshToken, deviceInfo }.
let refreshPromise = null;

function doRefresh(refreshToken) {
  // Raw axios (not `client`) so the refresh call itself never re-enters
  // this interceptor.
  return axios
    .post(`${client.defaults.baseURL}/auth/token/refresh`, {
      refreshToken,
      deviceInfo: navigator.userAgent,
    })
    .then((res) => {
      // Some backend versions return { data: { accessToken } } (standard
      // envelope) and others return { accessToken } directly. Handle both.
      const data = res.data?.data ?? res.data;
      if (!data?.accessToken) throw new Error("No access token in refresh response");
      applyRefreshedTokens(data);
      return data.accessToken;
    });
}

function getRefreshPromise(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = doRefresh(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Set while AuthContext is running its own startup hydration. A 401 during
// that phase should NOT immediately log the user out — it is likely a
// transient network hiccup or an expired access token that is about to be
// swapped out. Module-local (not window.__glassIsRestoring): AuthContext
// drives it via setSessionRestoring().
let isSessionRestoring = false;

export function setSessionRestoring(value) {
  isSessionRestoring = value;
}

export function isSessionRestoringActive() {
  return isSessionRestoring;
}

// Callers can open a short window (see beginAuthGrace below) where a 401
// is treated as transient rather than a real sign-out, the same reasoning
// AuthContext's restore phase (see setSessionRestoring) already applies to
// its own startup: right after landing back from a real Paystack redirect,
// the access token can be genuinely stale for a beat even though the
// session itself is fine, and hard-signing the payer out the moment they
// tap "Back to Home" -- right after watching their payment succeed -- reads
// as a broken app, not a security feature. If the session really is dead,
// the next real API call after the window closes clears it as normal.
let authGraceUntil = 0;

export function beginAuthGrace(ms = 6000) {
  authGraceUntil = Date.now() + ms;
}

function clearSessionAndRedirect() {
  // AuthContext sets the restoring flag while it is running its own
  // hydration call on startup. A 401 during that phase should NOT
  // immediately log the user out — it is likely a transient network hiccup
  // or an expired access token that is about to be swapped out. Suppressing
  // the redirect here lets restore() complete and the component tree render;
  // if the session is truly dead the next real API call (e.g. verifyPayment
  // in PaymentCallback) will trigger clearSessionAndRedirect again without
  // the flag set and the user will be taken to sign-in at that point.
  if (isSessionRestoring) return;
  if (Date.now() < authGraceUntil) return;

  // Single owner of the key list — identical set to AuthContext logout.
  clearSessionStorage();

  // window.location.href below is a hard navigation — it wipes any toast
  // shown right before it along with all other JS state. sessionStorage
  // survives the navigation, so the destination sign-in page can read this
  // flag on mount and show the explanation there instead.
  sessionStorage.setItem("glass_session_expired", "1");

  const path = window.location.pathname;
  // The payment callback page has no role in its path — an admin who paid
  // from the dashboard set paymentReturnTo before redirecting to Paystack,
  // so use that to send them to the right sign-in page, not the member one.
  const paymentReturnTo = sessionStorage.getItem("paymentReturnTo") ?? "";
  const isAdminArea =
    path.startsWith("/dashboard") ||
    path.startsWith("/onboarding") ||
    (path.startsWith("/payment") && paymentReturnTo.startsWith("/dashboard"));
  window.location.href = isAdminArea ? "/sign-in" : "/member/app-sign-in";
}

// A 401 from one of these means "wrong credentials," not "your session
// expired" — there's no session to refresh yet, since the user is still
// trying to establish one. Letting the refresh-and-redirect logic below
// run for these hard-navigates away from the sign-in form mid-attempt
// (clearing whatever they typed) before the caller's own catch block ever
// gets to show an inline/toast error.
// Exported so errorHandler.js can give a 401 from one of these a "wrong
// credentials" message instead of the generic "your session expired" copy
// written for an authenticated call whose token lapsed — same reasoning
// as above, just needed on the message side too.
export const PRE_AUTH_PATHS = ["/auth/login", "/auth/google", "/auth/mfa/totp/verify-login"];

// ── Global response handler ───────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPreAuthRequest = PRE_AUTH_PATHS.some((p) => originalRequest?.url?.includes(p));

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry && !isPreAuthRequest) {
      const refreshToken = getRefreshToken();

      // No refresh token available — nothing to do but log out. Requests
      // that opt out via _skipAuthRedirect (the payment callback page, which
      // must show its own "session expired" state instead of losing the
      // payment context to a hard navigation) just get the error back.
      if (!refreshToken) {
        if (!originalRequest._skipAuthRedirect) clearSessionAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Single-flight: every concurrent 401 awaits the same refresh
      // promise. Each waiter keeps its own _skipAuthRedirect semantics —
      // a queued opt-out request never triggers the hard redirect, even
      // though it shared the refresh attempt.
      try {
        const newToken = await getRefreshPromise(refreshToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        if (!originalRequest._skipAuthRedirect) clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default client;
