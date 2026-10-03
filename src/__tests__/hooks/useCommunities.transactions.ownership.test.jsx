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
// A promoted admin who does NOT own the community. isCommunityAdmin() is true
// for this (memberRole COMMUNITY_ADMIN -> keyword ADMIN) while `owned` is false
// — the exact divergence this suite pins.
const ADMIN_COMMUNITY = {
  id: "c2",
  slug: "admin-community",
  owned: false,
  memberRole: "COMMUNITY_ADMIN",
};
const MEMBER_COMMUNITY = {
  id: "c3",
  slug: "member-community",
  owned: false,
  memberRole: "COMMUNITY_MEMBER",
};

// Serves /communities/me and the per-community detail call. The members and
// transactions legs are mocked at the api layer above, so their call lists are
// exactly what the hook's `enabled` gates decided.
function serveList(communities) {
  return async (url) => {
    if (url === "/communities/me") {
      return { data: { data: { content: communities } } };
    }
    return { data: { data: { metrics: {} } } };
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

async function mountWith(communities) {
  const { useCommunitiesWithMetrics } = await import("../../hooks/useCommunities");
  const { default: clientMock } = await import("../../api/client");
  clientMock.get.mockImplementation(serveList(communities));

  const wrapper = createWrapper();
  const { result } = renderHook(() => useCommunitiesWithMetrics(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  // Let the enabled queries settle. Disabled ones never resolve, so only the
  // enabled ones appear in the call lists below.
  await new Promise((r) => setTimeout(r, 100));
  return result;
}

function slugsCalled(mock) {
  return mock.mock.calls.map(([slug]) => slug).sort();
}

describe("useCommunitiesWithMetrics gating on admin standing, not ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCommunityMock.mockResolvedValue({ data: { data: { metrics: {} } } });
    fetchAllCommunityMembersMock.mockResolvedValue([]);
    fetchAllCommunityTransactionsMock.mockResolvedValue([]);
  });

  // A. owner -> members enabled
  it("fetches members for a community the user owns", async () => {
    await mountWith([OWNED_COMMUNITY]);
    expect(fetchAllCommunityMembersMock).toHaveBeenCalledWith("owned-community");
  });

  // B. owner -> transactions enabled
  it("fetches transactions for a community the user owns", async () => {
    await mountWith([OWNED_COMMUNITY]);
    expect(fetchAllCommunityTransactionsMock).toHaveBeenCalledWith("owned-community");
  });

  // C. promoted COMMUNITY_ADMIN (not owner) -> members enabled
  it("fetches members for a promoted COMMUNITY_ADMIN who does not own it", async () => {
    await mountWith([ADMIN_COMMUNITY]);
    expect(fetchAllCommunityMembersMock).toHaveBeenCalledWith("admin-community");
  });

  // D. promoted COMMUNITY_ADMIN (not owner) -> transactions enabled
  it("fetches transactions for a promoted COMMUNITY_ADMIN who does not own it", async () => {
    await mountWith([ADMIN_COMMUNITY]);
    expect(fetchAllCommunityTransactionsMock).toHaveBeenCalledWith("admin-community");
  });

  // E. plain member -> members disabled
  it("does NOT fetch members for a community the user is only a member of", async () => {
    await mountWith([MEMBER_COMMUNITY]);
    expect(fetchAllCommunityMembersMock).not.toHaveBeenCalled();
  });

  // F. plain member -> transactions disabled
  it("does NOT fetch transactions for a community the user is only a member of", async () => {
    await mountWith([MEMBER_COMMUNITY]);
    expect(fetchAllCommunityTransactionsMock).not.toHaveBeenCalled();
  });

  it("fetches both legs for owners and admins but neither for a plain member", async () => {
    await mountWith([OWNED_COMMUNITY, ADMIN_COMMUNITY, MEMBER_COMMUNITY]);

    // Owners and admins both get the client-computed scalars. The member does
    // not, and the endpoint would 403 for them server-side anyway.
    expect(slugsCalled(fetchAllCommunityMembersMock)).toEqual([
      "admin-community",
      "owned-community",
    ]);
    expect(slugsCalled(fetchAllCommunityTransactionsMock)).toEqual([
      "admin-community",
      "owned-community",
    ]);
  });

  it("still fetches the community DETAIL for a plain member", async () => {
    // Only the two heavy legs are admin-gated. The detail leg never was, and
    // this pins that it was not swept along with them.
    const { useCommunitiesWithMetrics } = await import("../../hooks/useCommunities");
    const { default: clientMock } = await import("../../api/client");
    clientMock.get.mockImplementation(serveList([MEMBER_COMMUNITY]));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommunitiesWithMetrics(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await new Promise((r) => setTimeout(r, 100));

    expect(getCommunityMock).toHaveBeenCalledWith("member-community");
  });
});
