import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Finding 2 acceptance coverage: a refresh that starts before logout must
// not write tokens, restore state, or redirect once logout wins the race.
// Also covers the two-tab single-refresh path through separate client
// module instances sharing one localStorage.
const mockAxiosPost = vi.fn();

vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...actual,
    default: {
      ...actual.default,
      post: (...args) => mockAxiosPost(...args),
    },
  };
});

function jsonResponse(config, status, data) {
  if (status >= 200 && status < 300) {
    return Promise.resolve({ data, status, statusText: "", headers: {}, config });
  }
  const error = new Error(`Request failed with status code ${status}`);
  error.config = config;
  error.response = { data, status, statusText: "", headers: {}, config };
  return Promise.reject(error);
}

describe("client.js session-generation guard", () => {
  let client, setSessionRestoring;
  let originalLocation;

  beforeEach(async () => {
    vi.resetModules();
    mockAxiosPost.mockReset();
    localStorage.clear();
    sessionStorage.clear();

    originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: "", pathname: "/dashboard" };

    ({ default: client, setSessionRestoring } = await import("../../api/client"));
    setSessionRestoring(false);
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("a normal refresh leaves the generation untouched and persists rotated tokens", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    const { getSessionEpoch } = await import("../../store/sessionStorage");
    const epochBefore = getSessionEpoch();

    let calls = 0;
    client.defaults.adapter = (config) => {
      calls += 1;
      return calls === 1
        ? jsonResponse(config, 401, { message: "Unauthorized" })
        : jsonResponse(config, 200, { data: { ok: true } });
    };
    mockAxiosPost.mockResolvedValue({
      data: { data: { accessToken: "fresh-token", refreshToken: "fresh-refresh" } },
    });

    await expect(client.get("/members/me")).resolves.toBeTruthy();
    expect(localStorage.getItem("accessToken")).toBe("fresh-token");
    expect(localStorage.getItem("refreshToken")).toBe("fresh-refresh");
    expect(getSessionEpoch()).toBe(epochBefore);
    expect(window.location.href).toBe("");
  });

  it("logout during a refresh: no token write, no state restore, no redirect", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    const { clearSessionStorage, getSessionEpoch } = await import("../../store/sessionStorage");

    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    let releaseRefresh;
    mockAxiosPost.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () =>
            resolve({
              data: { data: { accessToken: "late-token", refreshToken: "late-refresh" } },
            });
        }),
    );

    const pending = client.get("/members/me");
    // Let the interceptor reach the refresh call.
    await vi.waitFor(() => expect(mockAxiosPost).toHaveBeenCalledTimes(1));

    // User logs out while the refresh is in flight (AuthContext.logout path).
    clearSessionStorage();
    const epochAfterLogout = getSessionEpoch();

    // The backend eventually answers — must be discarded, not applied.
    releaseRefresh();
    const err = await pending.catch((e) => e);
    expect(err?.response?.status).toBe(401);

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(getSessionEpoch()).toBe(epochAfterLogout);
    // No hard redirect: logout already navigated via SPA routing.
    expect(window.location.href).toBe("");
    expect(sessionStorage.getItem("glass_session_expired")).toBeNull();
  });

  it("a later fresh refresh still works after a stale one was discarded", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    const { clearSessionStorage } = await import("../../store/sessionStorage");

    client.defaults.adapter = (config) => {
      const auth = config.headers.Authorization ?? config.headers.authorization;
      return auth === "Bearer fresh-token"
        ? jsonResponse(config, 200, { data: { ok: true } })
        : jsonResponse(config, 401, { message: "Unauthorized" });
    };
    let releaseRefresh;
    mockAxiosPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => resolve({ data: { data: { accessToken: "late-token" } } });
        }),
    );

    const first = client.get("/a");
    await vi.waitFor(() => expect(mockAxiosPost).toHaveBeenCalledTimes(1));
    clearSessionStorage();
    releaseRefresh();
    await expect(first).rejects.toBeTruthy();

    // New session (e.g. re-login), then a normal expiry cycle.
    localStorage.setItem("accessToken", "stale-token-2");
    localStorage.setItem("refreshToken", "real-refresh-token-2");
    mockAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: "fresh-token" } },
    });
    await expect(client.get("/b")).resolves.toBeTruthy();
    expect(localStorage.getItem("accessToken")).toBe("fresh-token");
    expect(mockAxiosPost).toHaveBeenCalledTimes(2);
  });

  // The test above deliberately SEQUENCES its two requests — it awaits `first`
  // (settling the memoised refresh promise, and nulling the module-level memo)
  // before issuing /b. That ordering is what keeps it out of the race below,
  // where the old session's refresh is still in flight when the new session's
  // request arrives.
  //
  // Before the fix, getRefreshPromise() memoised per tab with no epoch key, so
  // the new request adopted the DEAD session's promise, adopted its
  // RefreshEpochChangedError, compared the current epoch against its own
  // (they matched, so the failure looked like "my session died") and called
  // clearSessionAndRedirect() on a session that was perfectly valid.
  //
  // Note on what is NOT fixed here: the new request still fails rather than
  // succeeding. The dead cycle holds this tab's cross-tab refresh lease until
  // it unwinds, so the new generation cannot win an election and falls back to
  // waiting on it — and refreshCoordinator surfaces the dead cycle's published
  // `stale` result as a generation change. Letting the new generation FORCE the
  // lease instead would need generational lease ownership in
  // refreshCoordinator.js; without it the dead cycle's `finally` would release
  // the new generation's lease and a second tab could then double-refresh the
  // same live refresh token — the backend reuse detection that revokes the
  // whole family. Out of scope here; the invariant below is what is pinned.
  it("a re-login landing while a stale-epoch refresh is in flight keeps the new session", async () => {
    const { clearSessionStorage, persistSession } = await import("../../store/sessionStorage");

    // ── Session 1 ──────────────────────────────────────────────────────────
    persistSession({ accessToken: "tok-1", refreshToken: "rt-1", userId: "u1" });
    localStorage.setItem("accessToken", "tok-1");

    let adapterCalls = 0;
    client.defaults.adapter = (config) => {
      adapterCalls += 1;
      const auth = config.headers.Authorization ?? config.headers.authorization;
      return auth === "Bearer tok-2-rotated"
        ? jsonResponse(config, 200, { data: { ok: true } })
        : jsonResponse(config, 401, { message: "Unauthorized" });
    };
    let releaseStale;
    mockAxiosPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseStale = () => resolve({ data: { data: { accessToken: "tok-1-rotated" } } });
        }),
    );

    const staleRequest = client.get("/a").catch((e) => e);
    await vi.waitFor(() => expect(mockAxiosPost).toHaveBeenCalledTimes(1));

    // ── The user logs out and immediately signs back in ───────────────────
    // (logout bumps the epoch; persistSession bumps it again)
    clearSessionStorage();
    persistSession({ accessToken: "tok-2", refreshToken: "rt-2", userId: "u2" });

    // ── The NEW session's request 401s while session 1's refresh is pending
    const racedRequest = client.get("/b").catch((e) => e);
    // Hold the race open: /b must reach the cross-tab election and be waiting
    // on session 1's still-held lease BEFORE session 1 unwinds. Releasing too
    // early would let /b win a free election and never exercise the race at
    // all (it would simply succeed, passing for the wrong reason).
    await vi.waitFor(() => expect(adapterCalls).toBe(2));
    await new Promise((r) => setTimeout(r, 20));
    expect(mockAxiosPost).toHaveBeenCalledTimes(1); // /b has NOT reached execute()

    // ── Session 1's refresh finally lands, against a dead generation ──────
    releaseStale();
    const staleErr = await staleRequest;
    const racedErr = await racedRequest;

    // Session 1's work was discarded, not applied — its rotated token never
    // came back (doRefresh's own generation guard).
    expect(staleErr?.response?.status).toBe(401);
    expect(localStorage.getItem("accessToken")).not.toBe("tok-1-rotated");

    // /b surfaces its OWN original 401, not the dead generation's internal
    // error — the failure is not evidence that session 2 is dead.
    expect(racedErr?.response?.status).toBe(401);
    expect(racedErr?.name).not.toBe("RefreshEpochChangedError");

    // THE INVARIANT: stale work from the dead generation must not clear,
    // overwrite, or invalidate the live session. Before the fix these read
    // null / null / "/sign-in", with glass_session_expired === "1".
    expect(localStorage.getItem("accessToken")).toBe("tok-2");
    expect(localStorage.getItem("refreshToken")).toBe("rt-2");
    expect(window.location.href).toBe("");
    expect(sessionStorage.getItem("glass_session_expired")).toBeNull();
  });

  it("the new session recovers on the next request once the dead cycle unwinds", async () => {
    // The invariant above is not merely "nothing exploded" — the new session
    // is still fully usable. Once the dead cycle releases the lease, an
    // ordinary expiry cycle refreshes normally and succeeds.
    const { clearSessionStorage, persistSession } = await import("../../store/sessionStorage");

    persistSession({ accessToken: "tok-1", refreshToken: "rt-1" });
    localStorage.setItem("accessToken", "tok-1");

    let adapterCalls = 0;
    client.defaults.adapter = (config) => {
      adapterCalls += 1;
      const auth = config.headers.Authorization ?? config.headers.authorization;
      return auth === "Bearer tok-2-rotated"
        ? jsonResponse(config, 200, { data: { ok: true } })
        : jsonResponse(config, 401, { message: "Unauthorized" });
    };
    let releaseStale;
    mockAxiosPost.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseStale = () => resolve({ data: { data: { accessToken: "tok-1-rotated" } } });
        }),
    );
    // Session 2's own cycle, once the lease is free.
    mockAxiosPost.mockImplementationOnce(() =>
      Promise.resolve({
        data: { data: { accessToken: "tok-2-rotated", refreshToken: "rt-2-rotated" } },
      }),
    );

    const staleRequest = client.get("/a").catch((e) => e);
    await vi.waitFor(() => expect(mockAxiosPost).toHaveBeenCalledTimes(1));
    clearSessionStorage();
    persistSession({ accessToken: "tok-2", refreshToken: "rt-2" });

    const racedRequest = client.get("/b").catch(() => {});
    await vi.waitFor(() => expect(adapterCalls).toBe(2));
    await new Promise((r) => setTimeout(r, 20));
    releaseStale();
    await racedRequest;
    await staleRequest;

    // Session 2 was never signed out, so it still has a refresh token to spend.
    expect(localStorage.getItem("refreshToken")).toBe("rt-2");
    expect(mockAxiosPost).toHaveBeenCalledTimes(1); // the raced request never refreshed

    // Ordinary expiry cycle on the surviving session.
    localStorage.setItem("accessToken", "tok-2-expired");
    const res = await client.get("/c");
    expect(res.data).toEqual({ data: { ok: true } });
    expect(localStorage.getItem("accessToken")).toBe("tok-2-rotated");
    expect(localStorage.getItem("refreshToken")).toBe("rt-2-rotated");
    expect(mockAxiosPost).toHaveBeenCalledTimes(2);
    expect(window.location.href).toBe("");
    expect(sessionStorage.getItem("glass_session_expired")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The memo identity guard (client.js `if (refreshPromise === tracked)`).
//
// Reachable ordering, traced through the real code:
//
//   1. Cycle P (generation 1) wins the cross-tab lease and blocks in
//      execute()  ->  refreshCoordinator.js:283 acquires, :303 awaits.
//   2. The user logs out and back in, so the generation moves.
//   3. A new request creates cycle S. S DISPLACES P in the module memo
//      (client.js:83) but cannot execute: P still owns the lease, so S loses
//      the election and becomes a waiter (refreshCoordinator.js:304).
//   4. P finally resolves. Its doRefresh rejects with a generation change
//      (client.js:67), so coordinateRefresh publishes `{ok:false, stale:true}`
//      (:307) and THEN releases the lease (:310) — catch before finally, so the
//      ordering is guaranteed by JS semantics.
//   5. P's `finally` runs. This is the only instant where a displaced cycle can
//      null a memo that is not its own. S is still a waiter at this moment:
//      its 100ms poll (refreshCoordinator.js:247) has not fired yet, so the
//      memo must still point at S.
//
// Remove the guard and step 5 nulls the live memo while S is pending. The next
// 401 then builds a THIRD cycle, which — the lease now being free and S holding
// none — wins the election and executes a second
// POST /auth/token/refresh with the SAME live refresh token. Against a backend
// that rotates refresh tokens, presenting a rotated-out token is reuse
// detection, which revokes the entire token family.
//
// Fake timers make this deterministic: time is frozen, so the lease never
// expires and S's poll and deadline NEVER fire. No real-time sleeps and no
// polling assumptions are involved; ordering comes only from explicit
// microtask flushes.
// ─────────────────────────────────────────────────────────────────────────────
describe("client.js refresh memo identity guard", () => {
  let client, setSessionRestoring, clearSessionStorage, persistSession;
  let originalLocation;

  // Microtasks are NOT affected by fake timers, so a fixed flush is a
  // deterministic barrier rather than a timing guess.
  const flushMicrotasks = async (rounds = 300) => {
    for (let i = 0; i < rounds; i += 1) await Promise.resolve();
  };

  beforeEach(async () => {
    vi.resetModules();
    mockAxiosPost.mockReset();
    localStorage.clear();
    sessionStorage.clear();

    vi.useFakeTimers();

    originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: "", pathname: "/dashboard" };

    client = (await import("../../api/client")).default;
    setSessionRestoring = (await import("../../api/client")).setSessionRestoring;
    ({ clearSessionStorage, persistSession } = await import("../../store/sessionStorage"));
    setSessionRestoring(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    window.location = originalLocation;
  });

  it("a displaced cycle settling must not let the next request start a second cycle with the same token", async () => {
    persistSession({ accessToken: "tok-1", refreshToken: "rt-1", userId: "u1" });
    localStorage.setItem("accessToken", "tok-1");
    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });

    let releaseStale;
    mockAxiosPost.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseStale = () => resolve({ data: { data: { accessToken: "tok-1-rotated" } } });
        }),
    );

    // (1) Cycle P wins the lease and blocks.
    const staleRequest = client.get("/a").catch((e) => e);
    await flushMicrotasks();
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);

    // (2) Logout + re-login while P is in flight.
    clearSessionStorage();
    persistSession({ accessToken: "tok-2", refreshToken: "rt-2", userId: "u2" });

    // (3) Cycle S displaces P but loses the election and waits on the lease.
    const successorRequest = client.get("/b").catch((e) => e);
    await flushMicrotasks();
    expect(mockAxiosPost).toHaveBeenCalledTimes(1); // S never reached execute()

    // (4) P settles: publishes its stale failure, releases the lease, and runs
    //     its finally — the exact instant the guard governs.
    releaseStale();
    const staleErr = await staleRequest;
    await flushMicrotasks();
    expect(staleErr?.response?.status).toBe(401);

    // (5) Time never advanced, so S's poll and deadline have never run and S is
    //     still the live, pending cycle. A request landing here must dedupe
    //     onto S rather than start a fresh one.
    const nextRequest = client.get("/c").catch((e) => e);
    await flushMicrotasks();

    // The regression: without the identity guard this is 2 — a second refresh
    // presenting rt-2 again, which is the reuse-detection trigger.
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);

    // Nothing was cleared, and the live session is intact throughout.
    expect(localStorage.getItem("accessToken")).toBe("tok-2");
    expect(localStorage.getItem("refreshToken")).toBe("rt-2");
    expect(window.location.href).toBe("");
    expect(sessionStorage.getItem("glass_session_expired")).toBeNull();

    // S and /c stay pending by construction: they are parked on the successor's
    // waiter, whose poll and deadline can never fire under frozen time. Both
    // already carry a rejection handler, so leaving them parked neither blocks
    // the test nor produces an unhandled rejection.
    expect(successorRequest).toBeInstanceOf(Promise);
    expect(nextRequest).toBeInstanceOf(Promise);
  });
});

describe("client.js cross-tab single refresh", () => {
  let originalLocation;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockAxiosPost.mockReset();

    originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: "", pathname: "/dashboard" };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("two tab contexts 401ing at once produce exactly one backend refresh", async () => {
    vi.resetModules();
    mockAxiosPost.mockReset();
    const tabA = (await import("../../api/client")).default;
    // Tab B gets its own module instance (own tabId, own refreshPromise)
    // sharing the same localStorage, like a real second tab.
    vi.resetModules();
    const tabB = (await import("../../api/client")).default;

    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");

    const adapter = (config) => {
      const auth = config.headers.Authorization ?? config.headers.authorization;
      return auth === "Bearer fresh-token"
        ? jsonResponse(config, 200, { data: { ok: true } })
        : jsonResponse(config, 401, { message: "Unauthorized" });
    };
    tabA.defaults.adapter = adapter;
    tabB.defaults.adapter = adapter;
    mockAxiosPost.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { data: { accessToken: "fresh-token" } } }), 30),
        ),
    );

    const [a, b] = await Promise.all([tabA.get("/a"), tabB.get("/b")]);

    expect(a.data).toEqual({ data: { ok: true } });
    expect(b.data).toEqual({ data: { ok: true } });
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBe("fresh-token");
  });
});
