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
