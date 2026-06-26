// import axios from "axios";

// const client = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
//   headers: { "Content-Type": "application/json" },
//   timeout: 15000,
// });

// // ── Attach JWT to every request ───────────────────────────────────────────────
// client.interceptors.request.use((config) => {
//   const token = localStorage.getItem("glass_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // ── Global response handler ───────────────────────────────────────────────────
// client.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("glass_token");
//       localStorage.removeItem("glass_user");
//       localStorage.removeItem("refreshToken");

//       // Route based on which side of the app the user was on,
//       // not a single hardcoded destination.
//       const path = window.location.pathname;
//       const isAdminArea =
//         path.startsWith("/dashboard") || path.startsWith("/onboarding");

//       window.location.href = isAdminArea ? "/member/signup" : "/member/app-sign-in";
//     }
//     return Promise.reject(error);
//   }
// );

// export default client;

import axios from "axios";

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
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh-token queue ────────────────────────────────────────────────────────
// Prevents multiple simultaneous 401s from firing multiple refresh calls.
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(newToken) {
  pendingQueue.forEach(({ resolve }) => resolve(newToken));
  pendingQueue = [];
}

function rejectQueue(err) {
  pendingQueue.forEach(({ reject }) => reject(err));
  pendingQueue = [];
}

function clearSessionAndRedirect() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("glass_user");
  localStorage.removeItem("refreshToken");

  const path = window.location.pathname;
  const isAdminArea = path.startsWith("/dashboard") || path.startsWith("/onboarding");
  window.location.href = isAdminArea ? "/sign-in" : "/member/app-sign-in";
}

// A 401 from one of these means "wrong credentials," not "your session
// expired" — there's no session to refresh yet, since the user is still
// trying to establish one. Letting the refresh-and-redirect logic below
// run for these hard-navigates away from the sign-in form mid-attempt
// (clearing whatever they typed) before the caller's own catch block ever
// gets to show an inline/toast error.
const PRE_AUTH_PATHS = ["/auth/login", "/auth/google", "/auth/mfa/totp/verify-login"];

// ── Global response handler ───────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPreAuthRequest = PRE_AUTH_PATHS.some((p) => originalRequest?.url?.includes(p));

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && !originalRequest._retry && !isPreAuthRequest) {
      const refreshToken = localStorage.getItem("refreshToken");

      // No refresh token available — nothing to do but log out
      if (!refreshToken) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If a refresh is already in flight, queue this request behind it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // POST /api/v1/auth/token/refresh — body: { refreshToken, deviceInfo }
        const res = await axios.post(
          `${client.defaults.baseURL}/auth/token/refresh`,
          { refreshToken, deviceInfo: navigator.userAgent }
        );

        const data = res.data?.data;
        if (!data?.accessToken) throw new Error("No access token in refresh response");

        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        resolveQueue(data.accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        rejectQueue(refreshError);
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default client;