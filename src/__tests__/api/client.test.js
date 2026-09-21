import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The refresh-token interceptor in client.js is the exact mechanism behind
// the very first bug investigated this session (member logged out after a
// successful payment). It has real, non-trivial logic -- a queue to
// prevent duplicate simultaneous refresh calls, a grace window for stale
// tokens right after an external redirect, and different behavior for
// pre-auth requests vs. an authenticated session going stale -- and had no
// dedicated test coverage before this file.
//
// axios.create() is left genuinely real here (not mocked) so client.js's
// actual interceptors run for real, not a re-implementation of them. Only
// two things are substituted: the real instance's transport adapter (to
// simulate backend responses without hitting the network) and the
// top-level axios.post export (used only for the separate, un-intercepted
// refresh-token call).

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

describe("client.js auth-refresh interceptor", () => {
  let client, beginAuthGrace, PRE_AUTH_PATHS, setSessionRestoring;
  let originalLocation;

  beforeEach(async () => {
    vi.resetModules();
    mockAxiosPost.mockReset();
    localStorage.clear();
    sessionStorage.clear();

    originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: "", pathname: "/dashboard" };

    ({
      default: client,
      beginAuthGrace,
      PRE_AUTH_PATHS,
      setSessionRestoring,
    } = await import("../../api/client"));
    setSessionRestoring(false);
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("on a 401 with a valid refresh token: refreshes, stores the new tokens, and retries the original request", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");

    let call = 0;
    client.defaults.adapter = (config) => {
      call += 1;
      if (config.url === "/members/me") {
        return call === 1
          ? jsonResponse(config, 401, { message: "Unauthorized" })
          : jsonResponse(config, 200, { data: { id: "user-1" } });
      }
      return Promise.reject(new Error(`Unexpected request: ${config.url}`));
    };
    mockAxiosPost.mockResolvedValue({
      data: { data: { accessToken: "fresh-token", refreshToken: "fresh-refresh" } },
    });

    const res = await client.get("/members/me");

    expect(res.data).toEqual({ data: { id: "user-1" } });
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockAxiosPost).toHaveBeenCalledWith(expect.stringContaining("/auth/token/refresh"), {
      refreshToken: "real-refresh-token",
      deviceInfo: expect.any(String),
    });
    expect(localStorage.getItem("accessToken")).toBe("fresh-token");
    expect(localStorage.getItem("refreshToken")).toBe("fresh-refresh");
  });

  it("queues concurrent 401s behind a single refresh call instead of refreshing once per request", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");

    const seenTokens = [];
    client.defaults.adapter = (config) => {
      const auth = config.headers.Authorization ?? config.headers.authorization;
      if (auth === "Bearer stale-token") {
        return jsonResponse(config, 401, { message: "Unauthorized" });
      }
      seenTokens.push(auth);
      return jsonResponse(config, 200, { data: { ok: true } });
    };
    // Resolve slowly on purpose so both requests' 401s land before the
    // refresh completes -- that's the actual race this queue exists for.
    mockAxiosPost.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { data: { accessToken: "fresh-token" } } }), 20),
        ),
    );

    const [a, b] = await Promise.all([client.get("/a"), client.get("/b")]);

    expect(a.data).toEqual({ data: { ok: true } });
    expect(b.data).toEqual({ data: { ok: true } });
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(seenTokens).toEqual(["Bearer fresh-token", "Bearer fresh-token"]);
  });

  it("with no refresh token available: clears the session and redirects, without ever attempting a refresh call", async () => {
    localStorage.setItem("accessToken", "stale-token");
    // Deliberately no refreshToken in localStorage.

    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });

    await expect(client.get("/members/me")).rejects.toBeTruthy();

    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(window.location.href).toBe("/sign-in");
  });

  it("a request marked _skipAuthRedirect never triggers the hard sign-out redirect, even with no refresh token", async () => {
    localStorage.setItem("accessToken", "stale-token");

    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });

    await expect(
      client.get("/payments/callback/verify", { _skipAuthRedirect: true }),
    ).rejects.toBeTruthy();

    expect(window.location.href).toBe("");
  });

  it("while an auth-grace window is open, a failed refresh does not clear the session or redirect", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");
    beginAuthGrace(6000);

    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    mockAxiosPost.mockRejectedValue({ response: { status: 401, data: {} } });

    await expect(client.get("/members/me")).rejects.toBeTruthy();

    // The refresh was still attempted and still failed -- grace only
    // suppresses the sign-out side effect, not the attempt itself.
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("accessToken")).toBe("stale-token");
    expect(window.location.href).toBe("");
  });

  it("when the refresh call itself fails outside any grace window: clears the session and redirects", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "real-refresh-token");

    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });
    mockAxiosPost.mockRejectedValue({ response: { status: 401, data: {} } });

    await expect(client.get("/members/me")).rejects.toBeTruthy();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(window.location.href).toBe("/sign-in");
  });

  it("sends an admin-area session-expiry to /sign-in and a member-app one to /member/app-sign-in", async () => {
    localStorage.setItem("accessToken", "stale-token");
    window.location.pathname = "/member/home";

    client.defaults.adapter = (config) => jsonResponse(config, 401, { message: "Unauthorized" });

    await expect(client.get("/members/me")).rejects.toBeTruthy();

    expect(window.location.href).toBe("/member/app-sign-in");
  });

  it("PRE_AUTH_PATHS is exported and includes the login endpoint, used by errorHandler.js to distinguish wrong-credentials from session-expiry", () => {
    expect(PRE_AUTH_PATHS).toContain("/auth/login");
  });
});
