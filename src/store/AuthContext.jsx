/**
 * src/store/AuthContext.jsx
 *
 * Wraps the entire app. Provides:
 *   useAuth() → { user, token, isAuthenticated, loading, login, logout, refreshUser }
 *
 * Token storage key: "glass_token"
 * User storage key:  "glass_user"
 *
 * On mount: reads token + user from localStorage so session survives refresh.
 * On 401:   the axios interceptor in client.js already clears the token and
 *           redirects — AuthContext just stays in sync via the storage event.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import client from "../api/client"; // your axios instance

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // ── Restore session from localStorage on mount ──────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem("glass_token");
    const storedUser = localStorage.getItem("glass_user");

    if (storedToken) {
      setToken(storedToken);
      try {
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("glass_user");
      }
    }
    setLoading(false);
  }, []);

  // ── Keep state in sync if another tab logs out (storage event) ──────────────
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "glass_token" && !e.newValue) {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSession = useCallback((token, user) => {
    localStorage.setItem("glass_token", token);

    localStorage.setItem("glass_user", JSON.stringify(user));

    setToken(token);
    setUser(user);
  }, []);

  // ── login ────────────────────────────────────────────────────────────────────
  // Calls POST /auth/login, stores token + user, updates state.
  // Returns the user object on success, throws on failure.
  const login = useCallback(
    async (email, password) => {
      const response = await client.post("/auth/login", {
        email,
        password,
      });

      const payload = response.data;

      if (!payload.success) {
        throw new Error(payload.message || "Login failed");
      }

      const { token, user } = payload.data;

      setSession(token, user);

      return user;
    },
    [setSession],
  );

  // ── logout ───────────────────────────────────────────────────────────────────
  // Calls POST /auth/logout (best-effort), clears local state.
  const logout = useCallback(async () => {
    try {
      await client.post("/auth/logout");
    } catch {
      // Ignore — we clear locally regardless
    } finally {
      localStorage.removeItem("glass_token");
      localStorage.removeItem("glass_user");
      setToken(null);
      setUser(null);
    }
  }, []);

  // ── refreshUser ──────────────────────────────────────────────────────────────
  // Re-fetches the current user profile from GET /auth/me and updates state.
  // Useful after profile edits.
  const refreshUser = useCallback(async () => {
    try {
      const response = await client.get("/auth/me");
      const { data: payload } = response;
      if (payload.success && payload.data) {
        setUser(payload.data);
        localStorage.setItem("glass_user", JSON.stringify(payload.data));
      }
    } catch {
      // If the token is invalid, the interceptor handles the 401 redirect
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,

    login,
    logout,
    refreshUser,

    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
