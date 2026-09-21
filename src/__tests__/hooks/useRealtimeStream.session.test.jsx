import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useRealtimeStream from "../../hooks/useRealtimeStream";
import { useAuth } from "../../store/AuthContext";
import { mintRealtimeTicket } from "../../api/realtime";

vi.mock("../../store/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/realtime", () => ({
  mintRealtimeTicket: vi.fn(),
}));

function Harness() {
  useRealtimeStream();
  return null;
}

function renderStream(authValue) {
  useAuth.mockReturnValue(authValue);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe("useRealtimeStream session gating (Sprint 2)", () => {
  it("does not mint an SSE ticket for an unverified token", async () => {
    mintRealtimeTicket.mockClear();
    renderStream({ isAuthenticated: true, sessionVerified: false });
    await waitFor(() => new Promise((r) => setTimeout(r, 50)));
    expect(mintRealtimeTicket).not.toHaveBeenCalled();
  });

  it("does not mint when unauthenticated", async () => {
    mintRealtimeTicket.mockClear();
    renderStream({ isAuthenticated: false, sessionVerified: false });
    await waitFor(() => new Promise((r) => setTimeout(r, 50)));
    expect(mintRealtimeTicket).not.toHaveBeenCalled();
  });
});
