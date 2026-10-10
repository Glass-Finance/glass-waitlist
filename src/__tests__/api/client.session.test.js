import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Sprint 2 acceptance coverage for the shared-refreshPromise interceptor:
// failure clears the full session-key set exactly once-per-waiter semantics,
// _skipAuthRedirect waiters keep no-redirect behavior on a shared failure,
// and the restoring flag suppresses the hard redirect.
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

const ALL_KEYS = [
  "accessToken",
  "refreshToken",
  "glass_user",
  "userId",
  "userEmail",
  "glass_community",
  "glass_member_community",
];

describe("client.js Sprint 2 session lifecycle", () => {
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

  it("refresh failure removes the SAME full session-key set AuthContext clears", async () => {
    ALL_KEYS.forEach((k) => localStorage.setItem(k, "seeded"));
    localStorage.setItem("refreshToken", "real-refresh-token");
    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    mockAxiosPost.mockRejectedValue({ response: { status: 401, data: {} } });

    await expect(client.get("/members/me")).rejects.toBeTruthy();

    ALL_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
    expect(window.location.href).toBe("/sign-in");
    expect(sessionStorage.getItem("glass_session_expired")).toBe("1");
  });

  it("concurrent normal + _skipAuthRedirect 401s share one refresh; only the normal one redirects", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    mockAxiosPost.mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject({ response: { status: 401, data: {} } }), 20),
        ),
    );

    const normal = client.get("/a");
    const skipped = client.get("/b", { _skipAuthRedirect: true });

    await expect(normal).rejects.toBeTruthy();
    await expect(skipped).rejects.toBeTruthy();
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe("/sign-in");

    // Second scenario: ONLY a _skipAuthRedirect waiter fails → no redirect,
    // session keys stay for the page's own expired-session UI.
    window.location.href = "";
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    mockAxiosPost.mockRejectedValue({ response: { status: 401, data: {} } });
    await expect(client.get("/c", { _skipAuthRedirect: true })).rejects.toBeTruthy();
    expect(window.location.href).toBe("");
    expect(localStorage.getItem("accessToken")).toBe("stale-token");
  });

  it("while session restoration is active, refresh failure neither clears nor redirects", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    setSessionRestoring(true);
    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    mockAxiosPost.mockRejectedValue({ response: { status: 401, data: {} } });

    await expect(client.get("/members/me")).rejects.toBeTruthy();

    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBe("stale-token");
    expect(window.location.href).toBe("");
  });

  it("a second expiry cycle after a failure starts a fresh refresh attempt", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    client.defaults.adapter = (config) => {
      const auth = config.headers.Authorization ?? config.headers.authorization;
      if (auth === "Bearer fresh-token") {
        return jsonResponse(config, 200, { data: { ok: true } });
      }
      return jsonResponse(config, 401, { message: "Unauthorized" });
    };
    mockAxiosPost.mockRejectedValueOnce({ response: { status: 401, data: {} } });
    await expect(client.get("/a")).rejects.toBeTruthy();

    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    window.location.href = "";
    mockAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: "fresh-token" } },
    });
    const res = await client.get("/b");
    expect(res.data).toEqual({ data: { ok: true } });
    expect(mockAxiosPost).toHaveBeenCalledTimes(2);
  });
});

// The `_retry` flag on the request config is the ONLY thing bounding a
// refresh cycle to one attempt per request. If it regressed, a single endpoint
// that keeps answering 401 would drive an unbounded stream of
// POST /auth/token/refresh calls — and against a backend that rotates refresh
// tokens, presenting a rotated-out token is reuse detection, which revokes the
// whole token family and signs the user out of every tab.
describe("client.js refresh retry is bounded to one attempt per request", () => {
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

  it("a retried request that 401s again rejects without a second refresh", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");

    let adapterCalls = 0;
    // Always 401 — including on the retry carrying the refreshed token.
    client.defaults.adapter = (config) => {
      adapterCalls += 1;
      return jsonResponse(config, 401, { message: "Unauthorized" });
    };
    // The refresh itself succeeds; only the retried request keeps failing.
    mockAxiosPost.mockResolvedValue({ data: { data: { accessToken: "fresh-token" } } });

    const err = await client.get("/members/me").catch((e) => e);

    // The original request was re-issued exactly once (initial + 1 retry).
    expect(adapterCalls).toBe(2);
    // ...and the backend was asked to refresh exactly once, not unboundedly.
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    // The final error propagates to the caller.
    expect(err?.response?.status).toBe(401);
    // The rotated token from the successful refresh was still applied.
    expect(localStorage.getItem("accessToken")).toBe("fresh-token");
    // A repeated 401 on the retried request does NOT sign the user out: it
    // falls straight through the `!originalRequest._retry` guard to the final
    // reject. Pinned because it is load-bearing in both directions — it is
    // what keeps a single flaky endpoint from tearing down a healthy session,
    // and it is also why `_retry` is the only bound on this loop.
    expect(localStorage.getItem("refreshToken")).toBe("real-refresh-token");
    expect(window.location.href).toBe("");
    expect(sessionStorage.getItem("glass_session_expired")).toBeNull();
  });

  it("a repeatedly-401ing request cannot drive an unbounded refresh loop", async () => {
    // Same shape, but asserting the loop terminates rather than counting calls:
    // even with the memo cleared between attempts, one request must produce at
    // most one refresh.
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    mockAxiosPost.mockResolvedValue({ data: { data: { accessToken: "fresh-token" } } });

    await expect(client.get("/members/me")).rejects.toBeTruthy();
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
  });

  it("pre-authentication 401s still never trigger a refresh or a redirect", async () => {
    // Unchanged behaviour, pinned explicitly: a 401 from a path in
    // PRE_AUTH_PATHS means "wrong credentials", not "session expired". There is
    // no session to refresh yet, and refreshing would hard-navigate off the
    // form and discard what the user typed before their own catch block could
    // explain the failure.
    for (const path of ["/auth/login", "/auth/otp/verify", "/auth/mfa/totp/verify-login"]) {
      mockAxiosPost.mockReset();
      window.location.href = "";
      client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });

      const err = await client.post(path, {}).catch((e) => e);

      expect(err?.response?.status).toBe(401);
      expect(mockAxiosPost).not.toHaveBeenCalled();
      expect(window.location.href).toBe("");
    }
  });
});
