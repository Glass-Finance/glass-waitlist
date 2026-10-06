import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { revokeMyJoinRequest } from "../../api/invites";
import { useRevokeMyJoinRequest } from "../../hooks/useInvites";

vi.mock("../../api/invites", () => ({ revokeMyJoinRequest: vi.fn() }));

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  return {
    invalidate,
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  revokeMyJoinRequest.mockReset();
  revokeMyJoinRequest.mockResolvedValue({ data: { data: {} } });
});

describe("useRevokeMyJoinRequest", () => {
  it("calls the revoke endpoint with the community and request ids", async () => {
    const { wrapper: W } = wrapper();
    const { result } = renderHook(() => useRevokeMyJoinRequest(), { wrapper: W });

    await result.current.revokeJoinRequest("glass-crew", "req-1");

    expect(revokeMyJoinRequest).toHaveBeenCalledWith("glass-crew", "req-1");
  });

  it("refreshes my join requests so the row flips to Withdrawn", async () => {
    const { invalidate, wrapper: W } = wrapper();
    const { result } = renderHook(() => useRevokeMyJoinRequest(), { wrapper: W });

    await result.current.revokeJoinRequest("glass-crew", "req-1");

    // Revoking keeps the row (as REVOKED), so this invalidates rather than
    // optimistically dropping it.
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["join-requests", "me"] }),
    );
  });

  it("still refreshes when the revoke fails, and rethrows for the caller", async () => {
    revokeMyJoinRequest.mockRejectedValue(new Error("Only pending join requests can be revoked"));
    const { invalidate, wrapper: W } = wrapper();
    const { result } = renderHook(() => useRevokeMyJoinRequest(), { wrapper: W });

    await expect(result.current.revokeJoinRequest("glass-crew", "req-1")).rejects.toThrow(
      /only pending/i,
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["join-requests", "me"] });
  });
});
