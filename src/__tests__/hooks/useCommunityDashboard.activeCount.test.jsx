import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// members.total must come from metrics.activeMembers, not the length of the
// member list. The list used to be a single un-paginated request inheriting the
// backend's default pageSize of 10, so members.total read 10 for every larger
// community.
//
// metrics.totalMembers is deliberately not the source: on the backend it is
// active + inactive + suspended + exited, so it counts soft-deleted (EXITED)
// members. The previous comment preferred the list length because "metrics can
// lag after member deletions" — true of totalMembers, but not of activeMembers,
// where a removed member is EXITED and therefore excluded from the count.

const { fetchMembersMock, fetchTransactionsMock, fetchObligationsMock, clientGetMock } = vi.hoisted(
  () => ({
    fetchMembersMock: vi.fn(),
    fetchTransactionsMock: vi.fn(),
    fetchObligationsMock: vi.fn(),
    clientGetMock: vi.fn(),
  }),
);

vi.mock("../../api/communities", () => ({
  fetchAllCommunityMembers: fetchMembersMock,
}));

// The dashboard reads the community detail through client.get directly (see
// fetchCommunity in useCommunityDashboard.js), not through api/communities.
vi.mock("../../api/client", () => ({
  default: { get: clientGetMock },
}));

vi.mock("../../api/transactions", () => ({
  fetchAllCommunityObligations: fetchObligationsMock,
  fetchAllCommunityTransactions: fetchTransactionsMock,
}));

function activeRows(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `member-${i + 1}`,
    status: "ACTIVE",
  }));
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

async function mountWith(metrics, memberRows) {
  const { useCommunityDashboard } = await import("../../hooks/useCommunityDashboard");
  clientGetMock.mockImplementation(async (url) => {
    if (url === "/communities/community-1") {
      return { data: { data: { metrics } } };
    }
    return { data: { data: { content: [] } } };
  });
  fetchMembersMock.mockResolvedValue(memberRows);

  const wrapper = createWrapper();
  const { result } = renderHook(() => useCommunityDashboard("community-1"), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await new Promise((r) => setTimeout(r, 100));
  return result;
}

describe("useCommunityDashboard — members.total uses metrics.activeMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTransactionsMock.mockResolvedValue([]);
    fetchObligationsMock.mockResolvedValue([]);
  });

  it("reports activeMembers=50 rather than the 10 rows fetched", async () => {
    const result = await mountWith({ activeMembers: 50, totalMembers: 70 }, activeRows(10));

    expect(result.current.members.total).toBe(50);
  });

  it("does not use totalMembers, which counts inactive/suspended/exited", async () => {
    const result = await mountWith({ activeMembers: 50, totalMembers: 70 }, activeRows(10));

    expect(result.current.members.total).not.toBe(70);
  });

  it("falls back to the fetched list length when metrics are unavailable", async () => {
    const result = await mountWith({}, activeRows(3));

    expect(result.current.members.total).toBe(3);
  });

  it("still returns the full member list for row consumers", async () => {
    // The member query is retained — the dashboard renders rows, not just a count.
    const result = await mountWith({ activeMembers: 2 }, activeRows(2));

    expect(result.current.members.list).toHaveLength(2);
    expect(result.current.members.total).toBe(2);
  });
});
