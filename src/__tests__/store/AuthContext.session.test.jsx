import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../../store/AuthContext";

vi.mock("../../api/members", () => ({
  getMe: vi.fn(),
}));

vi.mock("../../api/client", async () => {
  const actual = await vi.importActual("../../api/client");
  return {
    ...actual,
    default: {
      ...(actual.default ?? {}),
      get: vi.fn(),
    },
  };
});

import { getMe } from "../../api/members";
import client from "../../api/client";

function Probe() {
  const ctx = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="token">{ctx.token ?? "none"}</div>
      <div data-testid="verified">{String(ctx.sessionVerified)}</div>
      <div data-testid="alias">{typeof ctx.hydrateUserProfile}</div>
      <div data-testid="refresh-alias">{typeof ctx.refreshUser}</div>
    </div>
  );
}

function renderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(["probe"], { stale: true });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

describe("AuthContext Sprint 2 session lifecycle", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("failed restoration fails closed: clears every session key and never verifies", async () => {
    localStorage.setItem("accessToken", "stale-token");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1", isAdmin: true }));
    localStorage.setItem("userId", "u1");
    localStorage.setItem("glass_community", JSON.stringify({ id: "c1" }));
    getMe.mockRejectedValue({ response: { status: 401 } });
    client.get.mockRejectedValue({ response: { status: 401 } });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(screen.getByTestId("verified").textContent).toBe("false");
    for (const k of [
      "accessToken",
      "refreshToken",
      "glass_user",
      "userId",
      "userEmail",
      "glass_community",
      "glass_member_community",
    ]) {
      expect(localStorage.getItem(k)).toBeNull();
    }
  });

  it("keeps refreshUser as a backwards-compatible alias of hydrateUserProfile", async () => {
    getMe.mockRejectedValue({ response: { status: 401 } });
    client.get.mockRejectedValue({ response: { status: 401 } });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("alias").textContent).toBe("function");
    expect(screen.getByTestId("refresh-alias").textContent).toBe("function");
  });

  it("external session end (cross-tab storage event) clears React state and the query cache", async () => {
    localStorage.setItem("accessToken", "tok");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));
    getMe.mockResolvedValue({
      data: { data: { id: "u1", email: "a@b.c", platformRole: "USER" } },
    });
    client.get.mockResolvedValue({ data: { data: { content: [] } } });

    const { queryClient } = renderAuth();
    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(queryClient.getQueryData(["probe"])).toEqual({ stale: true });

    // Simulate another tab clearing the session: token gone from storage.
    localStorage.removeItem("accessToken");
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "accessToken", newValue: null }));
    });

    await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("none"));
    expect(screen.getByTestId("verified").textContent).toBe("false");
    expect(queryClient.getQueryData(["probe"])).toBeUndefined();
  });
});
