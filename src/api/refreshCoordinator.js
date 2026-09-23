/**
 * src/api/refreshCoordinator.js
 *
 * Cross-tab refresh coordination for the token-refresh flow in client.js.
 *
 * Problem: the backend rotates refresh tokens and treats reuse of a revoked
 * token as compromise (revoking the whole token family). client.js's shared
 * refreshPromise dedupes within ONE tab, but two tabs 401ing at once each
 * fire their own refresh with the same stored token — the loser presents a
 * rotated-out token and can nuke the session for every tab.
 *
 * Mechanism: a short-lived localStorage lease elects exactly one tab as the
 * refresh owner per cycle; the rest wait for the published result instead of
 * calling the backend. localStorage (not BroadcastChannel) is used because
 * the codebase already coordinates cross-tab through `storage` events, and
 * lease state doubles as crash recovery (a TTL bounds stale ownership).
 * This module is axios-free and React-free: client.js injects the actual
 * refresh call, sessionStorage.js owns the epoch it checks against.
 */

import { getSessionEpoch, getAccessToken, getRefreshToken } from "../store/sessionStorage";

export const REFRESH_LEASE_KEY = "glass_refresh_lease";
export const REFRESH_RESULT_KEY = "glass_refresh_result";
// Single source of truth for the refresh timing budget, expressed as a
// relationship rather than magic numbers:
//   LEASE_TTL_MS = REQUEST_TIMEOUT_MS + LEASE_MARGIN_MS
// The lease must outlive any legitimate refresh. REQUEST_TIMEOUT_MS mirrors
// the axios client's own timeout (client.js uses this constant), so the two
// can never drift apart silently; the margin covers scheduling/publish
// latency after the request itself settles. The TTL simultaneously bounds
// how long a crashed owner's lease can block other tabs.
export const REQUEST_TIMEOUT_MS = 15_000;
export const LEASE_MARGIN_MS = 5_000;
export const LEASE_TTL_MS = REQUEST_TIMEOUT_MS + LEASE_MARGIN_MS;
// Fallback poll granularity for waiters. `storage` events are the primary
// wake-up; the poll covers missed events and environments without them.
export const WAIT_POLL_MS = 100;
// Worst-case legitimate owner hold, derived (not arbitrary): lease TTL +
// one full request timeout + margin. Past this, the owner is wedged and a
// takeover attempt is safer than waiting forever.
export const WAIT_MARGIN_MS = LEASE_MARGIN_MS;

// Unique per tab (per module instance). Randomness avoids collisions with
// other tabs; the timestamp prefix keeps leases debuggable.
const tabId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function getTabId() {
  return tabId;
}

export class RefreshEpochChangedError extends Error {
  constructor() {
    super("Session generation changed during refresh");
    this.name = "RefreshEpochChangedError";
    this.code = "SESSION_CHANGED";
  }
}

export class RefreshFailedError extends Error {
  constructor(cause) {
    super("Coordinated refresh attempt failed");
    this.name = "RefreshFailedError";
    this.code = "REFRESH_FAILED";
    this.cause = cause;
  }
}

export class RefreshUnavailableError extends Error {
  constructor() {
    super("Refresh coordination exhausted without a result");
    this.name = "RefreshUnavailableError";
    this.code = "REFRESH_UNAVAILABLE";
  }
}

function readLease() {
  try {
    const raw = localStorage.getItem(REFRESH_LEASE_KEY);
    if (!raw) return null;
    const lease = JSON.parse(raw);
    if (
      typeof lease?.owner !== "string" ||
      typeof lease?.expiresAt !== "number" ||
      typeof lease?.at !== "number"
    ) {
      return null;
    }
    return lease;
  } catch {
    return null;
  }
}

/** The currently observed lease, if any. Used to seed waiter expectations. */
export function readRefreshLease() {
  return readLease();
}

function isLeaseLive(lease, now = Date.now()) {
  return !!lease && lease.expiresAt > now;
}

/**
 * Try to become the refresh owner. Fully synchronous (no awaits between the
 * write and the confirm-read), so within one tab the outcome is atomic.
 * A valid lease blocks everyone including this tab (in-tab concurrency is
 * deduped one layer up by client.js's refreshPromise; anything arriving
 * here while our own lease is held waits for its result instead of
 * executing twice). Across tabs a microscopic double-election window
 * remains; its worst case is identical to today's behavior (two refresh
 * calls), never worse.
 */
export function tryAcquireRefreshLease({ ttlMs = LEASE_TTL_MS, now = Date.now() } = {}) {
  const current = readLease();
  if (current && current.expiresAt > now) return false;
  const lease = { owner: tabId, at: now, expiresAt: now + ttlMs };
  try {
    localStorage.setItem(REFRESH_LEASE_KEY, JSON.stringify(lease));
  } catch {
    return false;
  }
  return readLease()?.owner === tabId;
}

export function releaseRefreshLease() {
  try {
    if (readLease()?.owner === tabId) localStorage.removeItem(REFRESH_LEASE_KEY);
  } catch {
    // ignore
  }
}

export function readRefreshResult() {
  try {
    const raw = localStorage.getItem(REFRESH_RESULT_KEY);
    if (!raw) return null;
    const result = JSON.parse(raw);
    if (typeof result?.ok !== "boolean" || typeof result?.at !== "number") return null;
    return result;
  } catch {
    return null;
  }
}

export function publishRefreshResult(result) {
  try {
    localStorage.setItem(REFRESH_RESULT_KEY, JSON.stringify({ ...result, at: Date.now() }));
  } catch {
    // ignore — waiters fall back to polling storage reads
  }
}

/**
 * Wait for another tab's refresh to conclude.
 * Resolves { outcome: "refreshed", accessToken } on success, or
 * { outcome: "takeover" } when a previously observed lease vanished without
 * a result (owner crashed or finished abnormally) so the caller can attempt
 * election. Takeover requires having SEEN a live lease first — an absent
 * lease at first sight means nothing on its own (the owner may publish a
 * fraction later), so early checks keep waiting instead of stampeding.
 * Throws RefreshEpochChangedError if the session generation moved (logout /
 * external clear) — the caller must then abort WITHOUT clearing again.
 * Throws RefreshFailedError if the owner attempted and failed — the caller
 * must propagate, never retry (retrying a rejected token risks backend
 * reuse detection).
 * @param {{ epoch?: number, since?: number, knownLease?: object|null, pollMs?: number, maxWaitMs?: number }} [opts]
 */
export function waitForRefreshResult({
  epoch,
  since = Date.now(),
  knownLease = null,
  pollMs = WAIT_POLL_MS,
  maxWaitMs,
} = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {ReturnType<typeof setInterval> | null} */
    let timer = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let deadlineTimer = null;
    let seenLiveLease = isLeaseLive(knownLease);

    function cleanup() {
      window.removeEventListener("storage", onStorage);
      if (timer) clearInterval(timer);
      if (deadlineTimer) clearTimeout(deadlineTimer);
    }

    function settle(fn) {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    }

    function check() {
      if (getSessionEpoch() !== epoch) {
        settle(() => reject(new RefreshEpochChangedError()));
        return;
      }
      const result = readRefreshResult();
      if (result && result.at >= since) {
        if (result.ok) {
          settle(() => resolve({ outcome: "refreshed", accessToken: getAccessToken() }));
        } else {
          settle(() => reject(new RefreshFailedError()));
        }
        return;
      }
      // No fresh result: only treat a vanished lease as a crashed owner if
      // we actually watched a live lease first. Otherwise keep waiting for
      // the result (or the absolute bound below).
      const lease = readLease();
      if (isLeaseLive(lease)) {
        seenLiveLease = true;
        return;
      }
      if (seenLiveLease) {
        settle(() => resolve({ outcome: "takeover" }));
      }
    }

    function onStorage(e) {
      if (
        e.key === REFRESH_RESULT_KEY ||
        e.key === REFRESH_LEASE_KEY ||
        e.key === "glass_session_epoch"
      ) {
        check();
      }
    }

    // Absolute bound, derived from the observed lease when possible so a
    // wedged owner (frozen tab holding a valid lease) cannot block waiters
    // forever: lease start + TTL + one request timeout + margin.
    const observed = readLease();
    const bound =
      typeof maxWaitMs === "number"
        ? maxWaitMs
        : (observed ? observed.at : Date.now()) +
          LEASE_TTL_MS +
          REQUEST_TIMEOUT_MS +
          WAIT_MARGIN_MS -
          Date.now();
    window.addEventListener("storage", onStorage);
    timer = setInterval(check, pollMs);
    deadlineTimer = setTimeout(
      () => {
        settle(() => resolve({ outcome: "takeover" }));
      },
      Math.max(bound, pollMs),
    );
    check();
  });
}

/**
 * Run one refresh cycle with cross-tab election.
 * - Winner re-reads the stored refresh token after electing: if another tab
 *   rotated it in the meantime, the winner stands down and adopts the fresh
 *   session instead of presenting a stale token (backend reuse detection
 *   would otherwise revoke the whole family).
 * - Otherwise the winner executes `execute()` (the real refresh call) and
 *   publishes the outcome for waiters. An owner-observed failure is
 *   published then rethrown — waiters propagate it without retrying.
 * - Losers wait; on takeover signal they loop back and attempt election
 *   (bounded rounds — crashed owners recover, live owners are never
 *   disturbed).
 * @param {{ epoch?: number, refreshToken?: string|null, execute?: () => Promise<string>, maxRounds?: number, leaseOptions?: object, waitOptions?: object }} [opts]
 */
export async function coordinateRefresh({
  epoch,
  refreshToken,
  execute,
  maxRounds = 4,
  leaseOptions,
  waitOptions,
} = {}) {
  if (typeof execute !== "function") throw new RefreshUnavailableError();
  for (let round = 0; round < maxRounds; round += 1) {
    const since = Date.now();
    if (tryAcquireRefreshLease(leaseOptions)) {
      try {
        // Another tab may have completed a rotation between our token read
        // and this election — presenting our stale copy would look like
        // reuse. Adopt the fresh session instead of executing.
        if (typeof refreshToken === "string" && getRefreshToken() !== refreshToken) {
          if (getSessionEpoch() !== epoch) throw new RefreshEpochChangedError();
          const current = getAccessToken();
          if (!current) throw new RefreshEpochChangedError();
          return current;
        }
        const accessToken = await execute();
        publishRefreshResult({ ok: true });
        return accessToken;
      } catch (err) {
        publishRefreshResult({ ok: false, stale: err instanceof RefreshEpochChangedError });
        throw err;
      } finally {
        releaseRefreshLease();
      }
    }
    const wait = await waitForRefreshResult({
      epoch,
      since,
      knownLease: readRefreshLease(),
      ...waitOptions,
    });
    if (wait.outcome === "refreshed") return wait.accessToken;
    // "takeover": loop around and attempt election.
  }
  throw new RefreshUnavailableError();
}
