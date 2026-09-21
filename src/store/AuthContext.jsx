/**
 * src/store/AuthContext.jsx
 *
 * Single source of truth for auth state.
 *
 * Token keys (unified — one set, used everywhere):
 *   localStorage "accessToken"   ← matches authService.storeAuthSession + client.js interceptor
 *   localStorage "refreshToken"  ← used by client.js auto-refresh interceptor
 *   localStorage "glass_user"    ← serialised user object
 *
 * Flow:
 *   1. Mount  → restore session from localStorage
 *   2. login()→ calls authService.login(), stores tokens, sets state
 *   3. 401    → client.js interceptor tries refresh, on failure clears tokens
 *   4. logout()→ calls authService.logout(), clears everything
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login as apiLogin, logout as apiLogout, storeAuthSession } from "../services/authService";
import { getMe } from "../api/members";
import client, { setSessionRestoring } from "../api/client";
import {
  KEY_TOKEN,
  SESSION_KEYS,
  getAccessToken,
  readStoredUser,
  writeStoredUser,
  clearSessionStorage,
} from "./sessionStorage";
import { parseUserData } from "../utils/userData";
import { isCommunityAdmin } from "../utils/communityRole";
import { isPlatformAdminRole } from "../utils/platformRole";

// Community-admin standing is separate from the backend's global
// platformRole. A USER may still administer one or more communities, while
// any other non-empty platformRole is a platform admin independently of
// community ownership.
function hasAdminCommunity(communities) {
  return (communities ?? []).some(isCommunityAdmin);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// Single-flight hydration fetch shared across StrictMode double-mounts and
// concurrent refreshUser()/restore() callers. The network pair fires once;
// each caller still applies the result to its own React state, so a
// stale/unmounted setter can never poison another mount.
let hydrateFetchPromise = null;

function fetchHydrationOnce() {
  if (!hydrateFetchPromise) {
    hydrateFetchPromise = Promise.all([getMe(), client.get("/communities/me")]).finally(() => {
      hydrateFetchPromise = null;
    });
  }
  return hydrateFetchPromise;
}

// writeStoredUser/clearSessionStorage own the key list (see sessionStorage.js).
// clearSession is the local-state counterpart: storage clear + community
// pointer hygiene live in clearSessionStorage; this wrapper exists so the
// call sites below read unchanged.
function clearSession() {
  clearSessionStorage();
}

// Callers (SignIn pages' routeAfterAuth) need an accurate isAdmin on the
// object login()/setSession() resolve with, immediately — not from a
// separate async refresh that might not have landed yet. So the admin
// check happens here, awaited, before login()/setSession() return.
async function buildUser(authData) {
  const responseUser = authData.user ?? {};
  let id = authData.userId ?? responseUser.id;
  let email = authData.email ?? responseUser.email;
  let role = authData.platformRole ?? responseUser.platformRole;
  let emailVerified = authData.emailVerified ?? responseUser.emailVerified;

  // OAuth responses have not always matched the password-login response
  // shape. Fill missing identity fields from the authenticated profile so
  // role routing remains identical across both login methods.
  if (!id || !email || !role) {
    try {
      const meRes = await getMe();
      const profile = meRes.data?.data ?? meRes.data;
      id ??= profile?.id;
      email ??= profile?.email;
      role ??= profile?.platformRole;
      emailVerified ??= profile?.emailVerified;
    } catch {
      // Keep the auth response fields; missing roles fail closed below.
    }
  }

  const isPlatformAdmin = isPlatformAdminRole(role);
  const user = {
    id,
    email,
    role,
    emailVerified,
    isPlatformAdmin,
    isAdmin: isPlatformAdmin,
  };
  try {
    const res = await client.get("/communities/me");
    user.isAdmin = isPlatformAdmin || hasAdminCommunity(res.data?.data?.content);
  } catch {
    // Platform admins retain global access even if community lookup fails.
  }
  return user;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  // Whether the current token + role state has been verified against the
  // backend (login/setSession's buildUser check, or restore's refreshUser).
  // Guards treat an unverified session as unauthenticated — a token merely
  // being present in localStorage proves nothing until the server confirms
  // it, and cached roles in glass_user are client-writable.
  const [sessionVerified, setSessionVerified] = useState(false);
  const queryClient = useQueryClient();
  // Prevents the token-change effect from firing a second refreshUser()
  // while restore() is already in the middle of one.
  const isRestoringRef = useRef(false);

  // Stay in sync if another tab ends the session. Watch every session key
  // (not just the access token) so a clear from any path — user logout,
  // refresh failure, fail-closed restore — converges all tabs. Clearing the
  // QueryClient matters as much as clearing React state: cached queries
  // carry no user identity, so without this the next account on this tab
  // would briefly see the previous account's data. Guards already redirect
  // on token==null, so no imperative navigation is needed here.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key && !SESSION_KEYS.includes(e.key)) return;
      // localStorage.clear() fires with key==null — treat as session end
      // only when the access token is actually gone.
      if (e.key && e.newValue) return;
      if (getAccessToken()) return;
      queryClient.clear();
      setToken(null);
      setUser(null);
      setSessionVerified(false);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queryClient]);

  // ── login ──────────────────────────────────────────────────────────────────
  /**
   * Calls authService.login() → stores tokens → updates state.
   * Identifier is email OR phoneNumber(+phoneRegion) -- never both.
   * Returns:
   *   { mfaRequired: true, mfaChallengeToken } — if MFA is needed (no session yet)
   *   user object                              — on success
   *
   * Throws on bad credentials / network error.
   */
  const login = useCallback(
    async ({ email, phoneNumber, phoneRegion, password }) => {
      // authService.login returns data.data (already unwrapped)
      const authData = await apiLogin({ email, phoneNumber, phoneRegion, password });
      // {
      //   accessToken, refreshToken, userId, email,
      //   platformRole, emailVerified, mfaRequired, mfaChallengeToken
      // }

      // MFA gate — caller must show TOTP screen, no session stored yet
      if (authData.mfaRequired) {
        return {
          mfaRequired: true,
          mfaChallengeToken: authData.mfaChallengeToken,
        };
      }

      // Persist tokens using the same helper authService exposes
      // so keys are guaranteed identical everywhere
      storeAuthSession(authData);

      // Every data hook (communities, notifications, member records, ...)
      // caches under a query key with no user identity in it, and the
      // QueryClient is a single instance that outlives any one session — so
      // without this, logging in as a different account on the same tab
      // serves the previous account's still-cached data until each query's
      // own staleTime happens to expire.
      queryClient.clear();

      const user = await buildUser(authData);

      writeStoredUser(user);
      setToken(authData.accessToken);
      setUser(user);
      setSessionVerified(true);

      if (typeof pendo !== "undefined") {
        pendo.identify({
          visitor: {
            id: user.id,
            email: user.email,
            platformRoleCode: user.role,
            emailVerified: user.emailVerified,
          },
        });
      }

      return user;
    },
    [queryClient],
  );

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiLogout(); // best-effort — server invalidates refresh token
    } catch {
      // ignore — clear locally regardless
    } finally {
      clearSession();
      queryClient.clear(); // see login()'s comment — same staleness risk in reverse
      setToken(null);
      setUser(null);
      setSessionVerified(false);
      // Pendo's install snippet only pre-stubs initialize/identify/
      // updateOptions/pageLoad/track/trackAgent — clearSession isn't in
      // that list, so it's only real once the CDN script actually loads.
      // Blocked by an ad-blocker or a strict CSP (common in production),
      // it stays undefined and this throws, which previously skipped the
      // navigate() in handleLogout entirely.
      if (typeof pendo?.clearSession === "function") pendo.clearSession();
    }
  }, [queryClient]);

  // ── setSession (for post-MFA, Google OAuth, etc.) ─────────────────────────
  /**
   * Manually set a session when you have auth data from a non-login flow
   * (e.g. after verifyMfaLogin, googleAuth).
   * Pass the raw authData object from the API response.
   */
  const setSession = useCallback(
    async (authData) => {
      storeAuthSession(authData);
      queryClient.clear(); // see login()'s comment
      const user = await buildUser(authData);
      writeStoredUser(user);
      setToken(authData.accessToken);
      setUser(user);
      setSessionVerified(true);

      if (typeof pendo !== "undefined") {
        pendo.identify({
          visitor: {
            id: user.id,
            email: user.email,
            platformRoleCode: user.role,
            emailVerified: user.emailVerified,
          },
        });
      }

      return user;
    },
    [queryClient],
  );

  // ── storeSessionIfPresent ──────────────────────────────────────────────────
  // Centralized "persist this auth response if it actually carries a
  // session" helper — replaces the duplicated maybeStoreSession closures
  // that lived in SignUp.jsx and Join/index.jsx. Always await it before
  // navigating: setSession() resolves admin standing via buildUser() first,
  // so navigating early routes on pre-session state.
  // Returns true when a session was stored, false when authData carries none.
  const storeSessionIfPresent = useCallback(
    async (authData) => {
      if (!authData?.accessToken) return false;
      await setSession(authData);
      return true;
    },
    [setSession],
  );

  // ── updateUser ─────────────────────────────────────────────────────────────
  // Call after profile edits so the UI reflects the change immediately.
  // NOTE: privilege fields (isAdmin/isPlatformAdmin/role) must never be set
  // through here — admin standing is derived server-side at login/restore.
  // The single exception is OrganizationProfile's post-creation
  // updateUser({ isAdmin: true }): the backend just made this user an admin
  // by creating their community, but the cached communities list predates it,
  // so routing would bounce without this explicit, auditable override.
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      writeStoredUser(updated);
      return updated;
    });
  }, []);

  // ── hydrateUserProfile (profile hydration — NOT token refresh) ──────────
  // login()/setSession() only ever populate {id, email, role, emailVerified}
  // — flat fields off the auth response, which has no name or photo on it.
  // Sidebar/Topbar/Settings all want firstName/lastName/profileImage, which
  // only exist on GET /user/me. Fetch it once we have a token, and let
  // callers (e.g. after a profile save) re-call this to pick up changes
  // immediately instead of waiting for the next full login.
  // Returns true when the session was re-verified against the backend,
  // false when verification failed — in which case the previous user state
  // is left untouched and the caller decides what to do (restore() fails
  // closed; post-login enrichment keeps the just-verified login state).
  // The underlying GET pair is single-flight (fetchHydrationOnce) so
  // StrictMode double-mounts and concurrent callers share one network
  // round-trip instead of firing duplicates.
  const hydrateUserProfile = useCallback(async () => {
    let meRes;
    let communitiesRes;
    try {
      [meRes, communitiesRes] = await fetchHydrationOnce();
    } catch {
      // Do NOT fall back to stale state here — the caller (restore())
      // treats a false return as "unverifiable" and fails closed.
      return false;
    }
    const profile = meRes.data?.data ?? meRes.data;
    const communities = communitiesRes.data?.data?.content ?? [];
    if (!profile) return false;
    const ud = parseUserData(profile);
    setUser((prev) => {
      if (!prev) return prev; // logged out while this was in flight
      const role = profile.platformRole ?? prev.role;
      const isPlatformAdmin = isPlatformAdminRole(role);
      const updated = {
        ...prev,
        email: profile.email ?? prev.email,
        role,
        firstName: ud.firstName,
        lastName: ud.lastName,
        phoneNumber: profile.phoneNumber ?? ud.phone,
        profileImage: ud.profileImage,
        isPlatformAdmin,
        isAdmin: isPlatformAdmin || hasAdminCommunity(communities),
      };
      writeStoredUser(updated);
      return updated;
    });

    // Re-identify with enriched profile + community (account) data
    if (profile.id && typeof pendo !== "undefined") {
      const pendoPayload = {
        visitor: {
          id: profile.id,
          email: profile.email,
          full_name: [ud.firstName, ud.lastName].filter(Boolean).join(" ") || undefined,
          accountName: profile.accountName,
          timezone: profile.timezone,
          platformRoleCode: profile.platformRole,
          emailVerified: profile.emailVerified,
          emailVerifiedAt: profile.emailVerifiedAt,
          lastLoginAt: profile.lastLoginAt,
          enabled: profile.enabled,
          createdAt: profile.createdAt,
          firstName: ud.firstName,
          lastName: ud.lastName,
        },
      };
      const primaryCommunity = communities[0];
      if (primaryCommunity) {
        pendoPayload.account = {
          id: String(primaryCommunity.id),
          name: primaryCommunity.name,
          slug: primaryCommunity.slug,
          category: primaryCommunity.category,
          defaultCurrency: primaryCommunity.defaultCurrency,
          status: primaryCommunity.status,
          requiresMemberApproval: primaryCommunity.requiresMemberApproval,
          publicVisible: primaryCommunity.publicVisible,
          createdAt: primaryCommunity.createdAt,
          archivedAt: primaryCommunity.archivedAt,
        };
      }
      pendo.identify(pendoPayload);
    }
    return true;
  }, []);

  // Backwards-compatible alias — public API stays stable.
  const refreshUser = hydrateUserProfile;

  // Restore session on mount. Until hydrateUserProfile() confirms the cached
  // token + roles against the backend, nothing renders as authenticated:
  // the cached glass_user is client-writable, so routing on it before
  // verification would honor stale or tampered admin standing. A failed
  // hydration fails closed — cached tokens/roles are dropped rather than
  // preserved, so guards redirect to sign-in instead of rendering on them.
  // Single-flight + StrictMode-safe: concurrent mounts share the same
  // hydration fetch (fetchHydrationOnce), and the restoring flag lives in
  // client.js (setSessionRestoring) instead of a window global.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const storedToken = getAccessToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      isRestoringRef.current = true;
      setSessionRestoring(true);
      setToken(storedToken);
      setUser(readStoredUser());
      try {
        const verified = await hydrateUserProfile();
        if (cancelled) return;
        if (verified) {
          setSessionVerified(true);
        } else {
          clearSession();
          queryClient.clear();
          setToken(null);
          setUser(null);
          setSessionVerified(false);
        }
      } finally {
        if (!cancelled) {
          setSessionRestoring(false);
          isRestoringRef.current = false;
          setLoading(false);
        }
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, [hydrateUserProfile, queryClient]);

  // Only fires for token changes that happen AFTER the initial restore
  // (login, setSession, OAuth). The restore() above handles its own hydration.
  useEffect(() => {
    if (token && !isRestoringRef.current) hydrateUserProfile();
  }, [token, hydrateUserProfile]);

  // ── Derive role helpers ────────────────────────────────────────────────────
  // Global platform admins and per-community admins both have desktop
  // dashboard access. isPlatformAdmin remains separate for platform-only UI.
  const isPlatformAdmin = user?.isPlatformAdmin ?? isPlatformAdminRole(user?.role);
  const isAdmin = isPlatformAdmin || (user?.isAdmin ?? false);
  const isMember = !isAdmin;

  const value = {
    user,
    token,
    loading,
    sessionVerified,
    isAuthenticated: !!token,
    isPlatformAdmin,
    isAdmin,
    isMember,

    // Actions
    login,
    logout,
    setSession,
    storeSessionIfPresent,
    updateUser,
    refreshUser,
    hydrateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// react-refresh/only-export-components wants this in its own file so Fast
// Refresh doesn't reset AuthProvider's state on every edit here -- true, but
// useAuth is imported in 31 files across the app, all touching auth. Moving
// it isn't a safe mechanical change to make without visually verifying every
// call site, and the downside of leaving it is a dev-server-only HMR
// nicety, not a production bug. Deliberately left as the standard
// context+hook-in-one-file pattern.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
