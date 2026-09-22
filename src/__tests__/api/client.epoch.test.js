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
