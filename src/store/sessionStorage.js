/**
 * src/store/sessionStorage.js
 *
 * Single owner of session persistence keys and storage operations.
 *
 * Strictly storage + a minimal in-tab session-end event. No routing,
 * no Axios, no React state, no business logic lives here.
 */

export const SESSION_KEYS = [
  "accessToken",
  "refreshToken",
  "glass_user",
  "userId",
  "userEmail",
  "glass_community",
  "glass_member_community",
];

export const KEY_TOKEN = "accessToken";
export const KEY_REFRESH_TOKEN = "refreshToken";
export const KEY_USER = "glass_user";
// Monotonic session generation. Bumped on every session end (clear) and
// every newly persisted session, so a stale async operation (e.g. an
// in-flight refresh) can detect that its generation is over before writing
// tokens back. Lives in localStorage so all tabs observe the same value.
// Deliberately NOT part of SESSION_KEYS: it must survive clearing.
export const KEY_EPOCH = "glass_session_epoch";

export function getAccessToken() {
  try {
    return localStorage.getItem(KEY_TOKEN);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(KEY_REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export function readStoredUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredUser(user) {
  try {
    if (user) localStorage.setItem(KEY_USER, JSON.stringify(user));
    else localStorage.removeItem(KEY_USER);
  } catch {
    // Storage unavailable (private mode quota) — React state remains source.
  }
}

export function getSessionEpoch() {
  try {
    const raw = localStorage.getItem(KEY_EPOCH);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function bumpSessionEpoch() {
  const next = getSessionEpoch() + 1;
  try {
    localStorage.setItem(KEY_EPOCH, String(next));
  } catch {
    // ignore — callers still set React state
  }
  return next;
}

/**
 * Persist tokens + basic identity from an auth response.
 * Never writes the literal string "undefined": a missing refreshToken
 * must leave the previous value alone so the refresh check in client.js
 * sees a real absence rather than a truthy "undefined" string.
 * Starts a new session generation: any stale in-flight operation from a
 * previous generation must not overwrite these tokens (see client.js).
 */
export function persistSession(authData) {
  if (!authData) return;
  try {
    if (authData.accessToken) localStorage.setItem(KEY_TOKEN, authData.accessToken);
    if (authData.refreshToken) localStorage.setItem(KEY_REFRESH_TOKEN, authData.refreshToken);
    if (authData.userId) localStorage.setItem("userId", authData.userId);
    if (authData.email) localStorage.setItem("userEmail", authData.email);
    bumpSessionEpoch();
  } catch {
    // ignore — callers still set React state
  }
}

/** Apply tokens from a refresh response (same dual-envelope already unwrapped by caller). */
export function applyRefreshedTokens(data) {
  if (!data?.accessToken) return;
  try {
    localStorage.setItem(KEY_TOKEN, data.accessToken);
    if (data.refreshToken) localStorage.setItem(KEY_REFRESH_TOKEN, data.refreshToken);
  } catch {
    // ignore
  }
}

// ── Minimal in-tab session-end event ─────────────────────────────────────────
// Cross-tab sync stays on the `storage` event (AuthContext subscribes).
// This emitter only lets in-tab subscribers (e.g. cache owners) react to a
// local clear without importing React or routing here.
const sessionEndListeners = new Set();

export function onSessionEnd(listener) {
  sessionEndListeners.add(listener);
  return () => sessionEndListeners.delete(listener);
}

function emitSessionEnd() {
  sessionEndListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // never break the clearer
    }
  });
}

/** Remove every session key. Idempotent — safe to call from N queued 401s. */
export function clearSessionStorage() {
  try {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
  // Invalidate the generation FIRST from the perspective of in-flight work:
  // any refresh started before this clear must observe the mismatch and
  // refuse to write tokens back (see client.js doRefresh).
  bumpSessionEpoch();
  emitSessionEnd();
}
