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

    // Build user object from flat fields (backend has no nested user object)
    const user = {
      id: authData.userId,
      email: authData.email,
      role: authData.platformRole, // "COMMUNITY_OWNER" | "MEMBER" | etc.
      emailVerified: authData.emailVerified,
    };

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
  const setSession = useCallback((authData) => {
    storeAuthSession(authData);
    const user = {
      id: authData.userId,
      email: authData.email,
      role: authData.platformRole,
      emailVerified: authData.emailVerified,
    };
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

  // ── Derive role helpers ────────────────────────────────────────────────────
  const role = user?.role ?? "";
  const isAdmin =
    role.includes("OWNER") ||
    role.includes("ADMIN") ||
    role.includes("MANAGER");
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
