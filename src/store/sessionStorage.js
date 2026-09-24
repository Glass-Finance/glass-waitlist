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

/**
 * Session-adjacent application state owned by the AUTHENTICATED USER (F6).
 *
 * Not credentials: each entry is one user's own data written under a key
 * that is not in SESSION_KEYS. Because nothing removed them when a session
 * ended, User A's value survived logout and was read straight back by
 * User B — the pending-join list drove another user's UI, the preference
 * mirror was merged into their next GET, and the cached Google identity was
 * rendered on the sign-in screen they then used.
 *
 * Deliberately a SEPARATE list from SESSION_KEYS rather than folded into it:
 *   * SESSION_KEYS is the set AuthContext's cross-tab `storage` handler
 *     treats as "the session ended" — widening it would make deleting a
 *     preference or a resolved join request tear down every other tab's
 *     live session.
 *   * KEY_EPOCH must keep surviving a clear (see below).
 * It is cleared in the same place, for the same reason: clearSessionStorage()
 * is the single funnel every session-ending path already funnels through,
 * so this needs no new lifecycle and no scattered removeItem() calls.
 *
 * Owners keep writing these freely while the user is authenticated — the
 * contract is only that the value cannot outlive the session that produced it.
 */
export const SESSION_ADJACENT_KEYS = [
  // useJoinApproval.js — the communities this user asked to join.
  "glass_pending_join_requests",
  // useNotifications.js — preference mirror spread into the queryFn result.
  "glass_notification_prefs",
  // GoogleAuthButton.jsx — cached {email, picture, name} for the sign-in
  // button. Also TTL-bounded at 7 days for the never-logged-out case.
  "glass_last_google_identity",
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

/**
 * Remove every session key AND every session-adjacent value.
 * Idempotent — safe to call from N queued 401s.
 *
 * Ordering is the invariant this function exists to guarantee:
 * authenticated state is fully gone BEFORE emitSessionEnd(), so a listener
 * (or anything reading storage from a synchronous continuation) can never
 * observe a half-cleared session where tokens are dropped but the user's
 * own data is still readable.
 */
export function clearSessionStorage() {
  try {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    SESSION_ADJACENT_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
  // Invalidate the generation FIRST from the perspective of in-flight work:
  // any refresh started before this clear must observe the mismatch and
  // refuse to write tokens back (see client.js doRefresh).
  bumpSessionEpoch();
  emitSessionEnd();
}
