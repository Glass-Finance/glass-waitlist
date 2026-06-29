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

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  login as apiLogin,
  logout as apiLogout,
  storeAuthSession,
} from "../services/authService";
import { getMe } from "../api/members";
import client from "../api/client";
import { parseUserData } from "../utils/userData";

// "Admin" has no global flag on this backend — platformRole/the JWT's role
// claim is a platform-wide value ("USER" for every account, even community
// owners) and never reflects per-community standing. Whether someone is an
// admin is only knowable from their communities list: owned, or a
// memberRole of OWNER/ADMIN/MANAGER on at least one community.
function hasAdminCommunity(communities) {
  return (communities ?? []).some((c) => {
    if (c.owned) return true;
    const role = (c.memberRole ?? "").toUpperCase();
    return role === "OWNER" || role === "ADMIN" || role === "MANAGER";
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Keys (one place — change here if you ever rename) ────────────────────────
const KEY_TOKEN = "accessToken"; // must match client.js interceptor
const KEY_USER = "glass_user";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readStoredUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeUser(user) {
  if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
  else localStorage.removeItem(KEY_USER);
}

function clearSession() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem("refreshToken");
  localStorage.removeItem(KEY_USER);
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
}

// Callers (SignIn pages' routeAfterAuth) need an accurate isAdmin on the
// object login()/setSession() resolve with, immediately — not from a
// separate async refresh that might not have landed yet. So the admin
// check happens here, awaited, before login()/setSession() return.
async function buildUser(authData) {
  const user = {
    id: authData.userId,
    email: authData.email,
    role: authData.platformRole,
    emailVerified: authData.emailVerified,
    isAdmin: false,
  };
  try {
    const res = await client.get("/communities/me");
    user.isAdmin = hasAdminCommunity(res.data?.data?.content);
  } catch {
    // Network hiccup — fall back to non-admin rather than block login.
  }
  return user;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Stay in sync if another tab logs out
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY_TOKEN && !e.newValue) {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  /**
   * Calls authService.login() → stores tokens → updates state.
   * Returns:
   *   { mfaRequired: true, mfaChallengeToken } — if MFA is needed (no session yet)
   *   user object                              — on success
   *
   * Throws on bad credentials / network error.
   */
  const login = useCallback(async (email, password) => {
    // authService.login returns data.data (already unwrapped)
    const authData = await apiLogin({ email, password });
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

    writeUser(user);
    setToken(authData.accessToken);
    setUser(user);

    pendo.identify({
      visitor: {
        id: user.id,
        email: user.email,
        platformRoleCode: user.role,
        emailVerified: user.emailVerified,
      },
    });

    return user;
  }, [queryClient]);

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
  const setSession = useCallback(async (authData) => {
    storeAuthSession(authData);
    queryClient.clear(); // see login()'s comment
    const user = await buildUser(authData);
    writeUser(user);
    setToken(authData.accessToken);
    setUser(user);

    pendo.identify({
      visitor: {
        id: user.id,
        email: user.email,
        platformRoleCode: user.role,
        emailVerified: user.emailVerified,
      },
    });

    return user;
  }, [queryClient]);

  // ── updateUser ─────────────────────────────────────────────────────────────
  // Call after profile edits so the UI reflects the change immediately.
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      writeUser(updated);
      return updated;
    });
  }, []);

  // ── refreshUser ────────────────────────────────────────────────────────────
  // login()/setSession() only ever populate {id, email, role, emailVerified}
  // — flat fields off the auth response, which has no name or photo on it.
  // Sidebar/Topbar/Settings all want firstName/lastName/profileImage, which
  // only exist on GET /user/me. Fetch it once we have a token, and let
  // callers (e.g. after a profile save) re-call this to pick up changes
  // immediately instead of waiting for the next full login.
  const refreshUser = useCallback(async () => {
    try {
      const [meRes, communitiesRes] = await Promise.all([
        getMe(),
        client.get("/communities/me"),
      ]);
      const profile = meRes.data?.data ?? meRes.data;
      const communities = communitiesRes.data?.data?.content ?? [];
      if (!profile) return;
      const ud = parseUserData(profile);
      setUser((prev) => {
        if (!prev) return prev; // logged out while this was in flight
        const updated = {
          ...prev,
          firstName: ud.firstName,
          lastName: ud.lastName,
          phoneNumber: profile.phoneNumber ?? ud.phone,
          profileImage: ud.profileImage,
          isAdmin: hasAdminCommunity(communities),
        };
        writeUser(updated);
        return updated;
      });

      // Re-identify with enriched profile + community (account) data
      if (profile.id) {
        const pendoPayload = {
          visitor: {
            id: profile.id,
            email: profile.email,
            full_name: [ud.firstName, ud.lastName].filter(Boolean).join(' ') || undefined,
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
    } catch {
      // Keep whatever we already had (e.g. from login) rather than wiping it.
    }
  }, []);

  // Restore session on mount. `loading` gates ProtectedRoute's very first
  // isAdmin check, so it can't flip to false until the *real* isAdmin is
  // confirmed — the cached value in localStorage can be stale (e.g. admin
  // status changed in another tab/session since the last login), and
  // ProtectedRoute would otherwise redirect away using that stale value
  // via a hard <Navigate> before refreshUser() ever got a chance to correct
  // it, with no way to self-heal afterward.
  useEffect(() => {
    async function restore() {
      const storedToken = localStorage.getItem(KEY_TOKEN);
      if (!storedToken) {
        setLoading(false);
        return;
      }
      setToken(storedToken);
      setUser(readStoredUser());
      await refreshUser();
      setLoading(false);
    }
    restore();
  }, [refreshUser]);

  useEffect(() => {
    if (token) refreshUser();
  }, [token, refreshUser]);

  // ── Derive role helpers ────────────────────────────────────────────────────
  // isAdmin lives on the user object itself now (set by buildUser/refreshUser
  // from the communities list — see hasAdminCommunity above), not derived
  // from platformRole, which is a platform-wide value with no per-community
  // meaning.
  const isAdmin = user?.isAdmin ?? false;
  const isMember = !isAdmin;

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin,
    isMember,

    // Actions
    login,
    logout,
    setSession,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
