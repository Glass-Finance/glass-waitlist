import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { fetchAllCommunityTransactionsMock, fetchAllCommunityMembersMock, getCommunityMock } =
  vi.hoisted(() => ({
    fetchAllCommunityTransactionsMock: vi.fn(),
    fetchAllCommunityMembersMock: vi.fn(),
    getCommunityMock: vi.fn(),
  }));

vi.mock("../../api/transactions", () => ({
  fetchAllCommunityTransactions: fetchAllCommunityTransactionsMock,
}));

vi.mock("../../api/communities", () => ({
  fetchAllCommunityMembers: fetchAllCommunityMembersMock,
  getCommunity: getCommunityMock,
}));

vi.mock("../../api/client", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

const OWNED_COMMUNITY = { id: "c1", slug: "owned-community", owned: true };
const MEMBER_COMMUNITY = { id: "c2", slug: "member-community", owned: false };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useCommunitiesWithMetrics transaction ownership gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCommunityMock.mockResolvedValue({ data: { data: { metrics: {} } } });
    fetchAllCommunityMembersMock.mockResolvedValue([]);
    fetchAllCommunityTransactionsMock.mockResolvedValue([]);
  });

  it("does NOT fetch transactions for communities the user does not own", async () => {
    const { useCommunitiesWithMetrics } = await import("../../hooks/useCommunities");
    const { default: clientMock } = await import("../../api/client");
    clientMock.get.mockImplementation((url) => {
      if (url === "/communities/me") {
        return Promise.resolve({
          data: { data: { content: [OWNED_COMMUNITY, MEMBER_COMMUNITY] } },
        });
      }
      if (url === "/communities/owned-community") {
        return Promise.resolve({ data: { data: { metrics: {} } } });
      }
      if (url === "/communities/member-community") {
        return Promise.resolve({ data: { data: { metrics: {} } } });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommunitiesWithMetrics(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(getCommunityMock).toHaveBeenCalled());
    // Wait for the owned community's transactions to be fetched
    await waitFor(() =>
      expect(fetchAllCommunityTransactionsMock).toHaveBeenCalledWith("owned-community"),
    );

    expect(fetchAllCommunityMembersMock).toHaveBeenCalledTimes(1);
    expect(fetchAllCommunityMembersMock).toHaveBeenCalledWith("owned-community");
    expect(fetchAllCommunityTransactionsMock).toHaveBeenCalledTimes(1);
    expect(fetchAllCommunityTransactionsMock).toHaveBeenCalledWith("owned-community");
  });

  it("fetches transactions for owned communities", async () => {
    const { useCommunitiesWithMetrics } = await import("../../hooks/useCommunities");
    const { default: clientMock } = await import("../../api/client");
    clientMock.get.mockImplementation((url) => {
      if (url === "/communities/me") {
        return Promise.resolve({ data: { data: { content: [OWNED_COMMUNITY] } } });
      }
      return Promise.resolve({ data: { data: { metrics: {} } } });
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommunitiesWithMetrics(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => {
      expect(fetchAllCommunityTransactionsMock).toHaveBeenCalledWith("owned-community");
    });
  });
});
