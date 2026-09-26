import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// F6: prove every session-ENDING path drops session-adjacent state, not just
// the logout button. These drive the real AuthProvider and the real axios
// interceptor in client.js — the only stub is the transport (client.defaults
// adapter) plus the raw `axios.post` that doRefresh() uses for the refresh
// call itself, because that call must not re-enter the interceptor.
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

import { AuthProvider, useAuth } from "../../store/AuthContext";
import {
  SESSION_KEYS,
  SESSION_ADJACENT_KEYS,
  clearSessionStorage,
} from "../../store/sessionStorage";
import client from "../../api/client";

// One payload satisfies both hydration reads: getMe() wants a profile and
// /communities/me wants { content: [...] }.
const HYDRATION_OK = {
  data: {
    data: {
      id: "u1",
      email: "user-a@example.com",
      platformRole: "USER",
      firstName: "User",
      lastName: "A",
      content: [],
    },
  },
};

function okAdapter(config) {
  return Promise.resolve({
    data: HYDRATION_OK.data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
}

function failAdapter(status) {
  return (config) =>
    Promise.reject({
      config,
      isAxiosError: true,
      response: { data: { message: "nope" }, status, statusText: "", headers: {}, config },
    });
}

// Kept by Probe so a test can drive ctx.logout()/ctx.refreshUser() directly
// instead of round-tripping through rendered markup.
let authCtx = null;
let queryClient = null;

function Probe() {
  const ctx = useAuth();
  // Captured in an effect (not during render — react-hooks/globals) so a
  // test can drive ctx.logout()/ctx.refreshUser() directly instead of
  // round-tripping through rendered markup.
  useEffect(() => {
    authCtx = ctx;
  });
  return (
    <>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="verified">{String(ctx.sessionVerified)}</div>
      <div data-testid="token">{ctx.token ?? "none"}</div>
    </>
  );
}

function renderAuth() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(["probe"], { owner: "user-a" });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function seedSession() {
  localStorage.setItem("accessToken", "stale-token");
  localStorage.setItem("refreshToken", "real-refresh-token");
  localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));
  localStorage.setItem("userId", "u1");
  localStorage.setItem("userEmail", "user-a@example.com");
}

function seedAdjacent() {
  SESSION_ADJACENT_KEYS.forEach((k) => localStorage.setItem(k, '{"owner":"user-a"}'));
}

function expectAllSessionStateCleared() {
  SESSION_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
  SESSION_ADJACENT_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
}

describe("F6 — session-adjacent state on every session-ending path", () => {
  let originalLocation;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    authCtx = null;
    queryClient = null;
    client.defaults.adapter = okAdapter;

    // AuthContext guards Pendo with `typeof pendo?.clearSession`, but the
    // optional-chained member access still evaluates the identifier — Pendo's
    // stub normally comes from index.html, which jsdom never loads. Declare
    // it so logout() reaches its finally block instead of throwing.
    globalThis.pendo = undefined;

    // clearSessionAndRedirect() hard-navigates; give it a writable location
    // (same technique client.session.test.js uses) so jsdom doesn't attempt
    // a real navigation.
    originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: "", pathname: "/dashboard" };
  });

  afterEach(() => {
    window.location = originalLocation;
    delete globalThis.pendo;
  });

  it("explicit logout clears session-adjacent state", async () => {
    seedSession();
    seedAdjacent();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));

    // Still authenticated: the state must NOT have been touched yet.
    expect(localStorage.getItem("glass_notification_prefs")).not.toBeNull();

    await act(async () => {
      await authCtx.logout();
    });

    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(screen.getByTestId("verified").textContent).toBe("false");
    expectAllSessionStateCleared();
    expect(queryClient.getQueryData(["probe"])).toBeUndefined();
  });

  it("failed session restoration clears session-adjacent state", async () => {
    seedSession();
    seedAdjacent();
    // 500 (not 401) — fails hydration without entering the refresh flow.
    client.defaults.adapter = failAdapter(500);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    // Fails closed: dropped tokens AND the user's own stored state.
    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(screen.getByTestId("verified").textContent).toBe("false");
    expectAllSessionStateCleared();
  });

  it("refresh/session failure clears session-adjacent state", async () => {
    seedSession();
    seedAdjacent();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(localStorage.getItem("glass_pending_join_requests")).not.toBeNull();

    // Session now expires: the API 401s and the refresh attempt is rejected.
    client.defaults.adapter = failAdapter(401);
    mockAxiosPost.mockRejectedValue({ response: { status: 401, data: {} } });

    await act(async () => {
      await authCtx.refreshUser();
    });

    expectAllSessionStateCleared();
    expect(window.location.href).toBe("/sign-in");
    expect(sessionStorage.getItem("glass_session_expired")).toBe("1");
  });

  it("cross-tab session termination leaves no session-adjacent state behind", async () => {
    seedSession();
    seedAdjacent();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(queryClient.getQueryData(["probe"])).toEqual({ owner: "user-a" });

    // Tab A logs out. localStorage is shared between tabs, so its clear is
    // what actually removes the values Tab B can see.
    await act(async () => {
      clearSessionStorage();
    });

    // Tab B now observes the session ending.
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "accessToken", newValue: null }));
    });

    await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("none"));
    expect(screen.getByTestId("verified").textContent).toBe("false");
    expect(queryClient.getQueryData(["probe"])).toBeUndefined();
    SESSION_ADJACENT_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
  });

  it("removing only a session-adjacent key is NOT a session termination", async () => {
    // Guards the reason the two key lists must stay separate: SESSION_KEYS is
    // what AuthContext's storage handler treats as "the session ended".
    // Dropping a preference or a resolved join request must not tear down a
    // live session in every other tab.
    seedSession();
    seedAdjacent();
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));

    localStorage.removeItem("glass_notification_prefs");
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "glass_notification_prefs", newValue: null }),
      );
    });

    expect(screen.getByTestId("token").textContent).toBe("stale-token");
    expect(screen.getByTestId("verified").textContent).toBe("true");
    expect(queryClient.getQueryData(["probe"])).toEqual({ owner: "user-a" });
  });
});
