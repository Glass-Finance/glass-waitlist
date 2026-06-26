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
import {
  login as apiLogin,
  logout as apiLogout,
  storeAuthSession,
} from "../services/authService";
import { getMe } from "../api/members";
import client from "../api/client";

// GET /user/me doesn't return firstName/lastName/phone as flat fields —
// they're nested in userData, which can come back as a JSON string or an
// object depending on the field (matches Profile.jsx's parseUserData,
// which is the confirmed-working version of this since it renders the
// name correctly there already).
function parseUserData(profile) {
  try {
    const ud = typeof profile?.userData === "string" ? JSON.parse(profile.userData) : profile?.userData;
    return ud ?? {};
  } catch {
    return {};
  }
}

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

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(KEY_TOKEN);
    if (storedToken) {
      setToken(storedToken);
      setUser(readStoredUser());
    }
    setLoading(false);
  }, []);

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

    console.log("AUTH DATA", authData);
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

    const user = await buildUser(authData);

    writeUser(user);
    setToken(authData.accessToken);
    setUser(user);

    return user;
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiLogout(); // best-effort — server invalidates refresh token
    } catch {
      // ignore — clear locally regardless
    } finally {
      clearSession();
      setToken(null);
      setUser(null);
    }
  }, []);

  // ── setSession (for post-MFA, Google OAuth, etc.) ─────────────────────────
  /**
   * Manually set a session when you have auth data from a non-login flow
   * (e.g. after verifyMfaLogin, googleAuth).
   * Pass the raw authData object from the API response.
   */
  const setSession = useCallback(async (authData) => {
    storeAuthSession(authData);
    const user = await buildUser(authData);
    writeUser(user);
    setToken(authData.accessToken);
    setUser(user);
    return user;
  }, []);

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
          profileImage: profile.profileImage,
          isAdmin: hasAdminCommunity(communities),
        };
        writeUser(updated);
        return updated;
      });
    } catch {
      // Keep whatever we already had (e.g. from login) rather than wiping it.
    }
  }, []);

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
