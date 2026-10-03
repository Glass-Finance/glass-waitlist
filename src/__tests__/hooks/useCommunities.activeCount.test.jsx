import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// The ACTIVE member count must come from metrics.activeMembers, NOT from the
// length of the member list and NOT from metrics.totalMembers.
//
// Why: the member list used to be a single un-paginated request inheriting the
// backend's default pageSize of 10, so a community with 50 active members
// reported 10 on Communities Home. metrics.activeMembers is a server-side
// COUNT over ACTIVE rows with no page limit.
//
// Why not totalMembers: on the backend it is active + inactive + suspended +
// exited, so it counts soft-deleted (EXITED) members. The UI intent is ACTIVE.
//
// Why this is admin-only: `metrics` is permission-gated on
// community.metrics.read, granted to COMMUNITY_OWNER and COMMUNITY_ADMIN only.
// A plain member receives no metrics block at all, so the count must stay null
// rather than depending on a field they cannot receive.

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
const PLAIN_MEMBER_COMMUNITY = {
  id: "c2",
  slug: "member-community",
  owned: false,
  memberRole: "COMMUNITY_MEMBER",
};

// /communities/me never carries metrics; the per-community detail leg does, and
// that leg goes through the mocked getCommunity (api/communities), not client.get.
// So metricsBySlug is served from getCommunityMock, keyed by the identifier the
// hook passes (slug when present).
function serveMetrics(metricsBySlug) {
  getCommunityMock.mockImplementation(async (identifier) => ({
    data: { data: { metrics: metricsBySlug[identifier] ?? {} } },
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

async function mountWith(communities, metricsBySlug = {}) {
  const { useCommunitiesWithMetrics } = await import("../../hooks/useCommunities");
  const { default: clientMock } = await import("../../api/client");
  serveMetrics(metricsBySlug);
  clientMock.get.mockImplementation(async () => ({
    data: { data: { content: communities } },
  }));

  const wrapper = createWrapper();
  const { result } = renderHook(() => useCommunitiesWithMetrics(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await new Promise((r) => setTimeout(r, 100));
  return result;
}

function membersOf(result, index = 0) {
  return result.current.data.communities[index].metrics;
}

function activeRows(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `member-${i + 1}`,
    status: "ACTIVE",
  }));
}

describe("useCommunitiesWithMetrics — ACTIVE member count source", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCommunityMock.mockResolvedValue({ data: { data: { metrics: {} } } });
    fetchAllCommunityMembersMock.mockResolvedValue([]);
    fetchAllCommunityTransactionsMock.mockResolvedValue([]);
  });

  it("reports activeMembers=11 rather than the 10 rows returned", async () => {
    // The bug's exact shape: metrics says 11, the list only ever had 10.
    fetchAllCommunityMembersMock.mockResolvedValue(activeRows(10));

    const result = await mountWith([OWNED_COMMUNITY], {
      "owned-community": { activeMembers: 11, totalMembers: 20 },
    });

    expect(membersOf(result).totalMembers).toBe(11);
  });

  it("reports 50 when activeMembers=50 and totalMembers=70", async () => {
    fetchAllCommunityMembersMock.mockResolvedValue(activeRows(10));

    const result = await mountWith([OWNED_COMMUNITY], {
      "owned-community": { activeMembers: 50, totalMembers: 70 },
    });

    // 70 would mean counting inactive/suspended/exited members.
    expect(membersOf(result).totalMembers).toBe(50);
  });

  it("does not fall back to totalMembers when activeMembers is absent", async () => {
    // A defensive case: if only the all-inclusive metric were present, showing
    // it would reintroduce the soft-deleted-member inflation the fan-out
    // existed to remove. The list fallback is used instead.
    fetchAllCommunityMembersMock.mockResolvedValue(activeRows(10));

    const result = await mountWith([OWNED_COMMUNITY], {
      "owned-community": { totalMembers: 70 },
    });

    expect(membersOf(result).totalMembers).toBe(10);
  });

  it("keeps the member-list length as a fallback when metrics are unavailable", async () => {
    fetchAllCommunityMembersMock.mockResolvedValue(activeRows(3));

    const result = await mountWith([OWNED_COMMUNITY], {
      "owned-community": {},
    });

    expect(membersOf(result).totalMembers).toBe(3);
  });

  it("leaves the count null for a plain member, who receives no metrics", async () => {
    fetchAllCommunityMembersMock.mockResolvedValue([]);

    const result = await mountWith([PLAIN_MEMBER_COMMUNITY], {});

    // metrics is permission-gated to owner/admin, so a plain member gets
    // {} and the card renders no count. Unchanged by this fix.
    expect(membersOf(result).totalMembers).toBeNull();
    expect(fetchAllCommunityMembersMock).not.toHaveBeenCalled();
  });

  it("still merges a full paginated member list into the count-independent shape", async () => {
    // Proves the hook's returned metrics shape is untouched by the count change.
    fetchAllCommunityMembersMock.mockResolvedValue(activeRows(250));
    fetchAllCommunityTransactionsMock.mockResolvedValue([]);

    const result = await mountWith([OWNED_COMMUNITY], {
      "owned-community": { activeMembers: 250, totalMembers: 300 },
    });

    expect(membersOf(result).totalMembers).toBe(250);
    // Count comes from metrics, so the list length is not consulted for it.
    expect(fetchAllCommunityMembersMock).toHaveBeenCalledWith("owned-community");
  });
});
