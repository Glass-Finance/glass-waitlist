import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Regression guard for six consumers that each owned an inline
// useQuery({ queryKey: ["communities"] }) whose queryFn called
// getMyCommunities() -- a SINGLE request to an endpoint that is paginated and
// defaults to 10. A user in more than 10 communities therefore lost the rest of
// their memberships in every one of those paths, and because only useMyAccount
// normalized `logo`, whichever of the six observers fetched first also decided
// whether everyone else read a raw server-controlled logo URL.
//
// All six now read one entry, owned by useMyCommunities(), sourced from the
// shared walk in api/communityList.js.
//
// Mocked at api/client, NOT at api/communityList, so the page walk is genuinely
// exercised here -- a mock returning every community from one request would let
// a first-page-only implementation pass, which is exactly the regression these
// tests exist to catch.
vi.mock("../../api/client", async () => {
  const actual = await vi.importActual("../../api/client");
  return { ...actual, default: { ...(actual.default ?? {}), get: vi.fn() } };
});

import client from "../../api/client";

const COMMUNITIES_KEY = ["communities"];

// Ten member-only communities, then the interesting one. Ordered the way the
// backend orders (/communities/me sorts createdAt desc), so the last entry is
// guaranteed to be off page 1.
const TEN_MEMBERSHIPS = Array.from({ length: 10 }, (_, i) => ({
  id: `c-${i + 1}`,
  slug: `c-${i + 1}`,
  name: `Community ${i + 1}`,
  owned: false,
  memberRole: "COMMUNITY_MEMBER",
  memberStatus: "ACTIVE",
}));

function page({ content, pageNumber, totalElements, totalPages, last }) {
  return { content, pageNumber, pageSize: 10, totalElements, totalPages, last };
}

/** Serve /communities/me the way the backend does: 10 rows per page. */
function serveCommunities(all, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  return vi.fn(async (_url, config) => {
    const pn = typeof config?.params?.pageNumber === "number" ? config.params.pageNumber : 1;
    const start = (pn - 1) * pageSize;
    return {
      data: {
        data: page({
          content: all.slice(start, start + pageSize),
          pageNumber: pn,
          totalElements: all.length,
          totalPages,
          last: pn >= totalPages,
        }),
      },
    };
  });
}

function communitiesRequests() {
  return client.get.mock.calls.filter(([url]) => url === "/communities/me");
}

function requestedPageNumbers() {
  return communitiesRequests().map(([, config]) => config?.params?.pageNumber);
}

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  const W = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { W, queryClient };
}

const OFF_PAGE_COMMUNITY = {
  id: "c-off-page",
  slug: "off-page",
  name: "Off Page Community",
  owned: false,
  memberRole: "COMMUNITY_MEMBER",
  memberStatus: "ACTIVE",
  logo: { url: "https://res.cloudinary.com/demo/image/upload/v1/off-page.png" },
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('useMyCommunities — the single owner of ["communities"]', () => {
  it("returns every membership, not just the first page", async () => {
    client.get.mockImplementation(serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]));
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W } = wrapper();

    const { result } = renderHook(() => useMyCommunities(), { wrapper: W });
    await waitFor(() => expect(result.current.data).toHaveLength(11));

    expect(requestedPageNumbers()).toEqual([1, 2]);
    expect(result.current.data.map((c) => c.slug)).toContain("off-page");
  });

  it("walks pages 1-based and sequentially", async () => {
    client.get.mockImplementation(serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]));
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W } = wrapper();

    renderHook(() => useMyCommunities(), { wrapper: W });
    await waitFor(() => expect(communitiesRequests()).toHaveLength(2));

    expect(requestedPageNumbers()[0]).toBe(1);
    expect(requestedPageNumbers()).not.toContain(0);
    expect(new Set(requestedPageNumbers()).size).toBe(requestedPageNumbers().length);
  });

  it("normalizes logo for every consumer, not just its original one", async () => {
    // The asymmetry this closes: five of the six read the raw server logo off
    // this shared entry. A javascript: URL must never reach a consumer.
    client.get.mockImplementation(
      serveCommunities([
        ...TEN_MEMBERSHIPS,
        { ...OFF_PAGE_COMMUNITY, logo: { url: "javascript:alert(1)" } },
      ]),
    );
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W } = wrapper();

    const { result } = renderHook(() => useMyCommunities(), { wrapper: W });
    await waitFor(() => expect(result.current.data).toHaveLength(11));

    const rejected = result.current.data.find((c) => c.slug === "off-page");
    expect(rejected.logo.url).toBeNull();
  });

  it("keeps a safe logo untouched and preserves the logo object's other fields", async () => {
    client.get.mockImplementation(
      serveCommunities([
        ...TEN_MEMBERSHIPS,
        {
          ...OFF_PAGE_COMMUNITY,
          logo: { url: "https://res.cloudinary.com/demo/x.png", id: "file-1", fileType: "IMAGE" },
        },
      ]),
    );
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W } = wrapper();

    const { result } = renderHook(() => useMyCommunities(), { wrapper: W });
    await waitFor(() => expect(result.current.data).toHaveLength(11));

    const kept = result.current.data.find((c) => c.slug === "off-page");
    expect(kept.logo.url).toBe("https://res.cloudinary.com/demo/x.png");
    expect(kept.logo.id).toBe("file-1");
    expect(kept.logo.fileType).toBe("IMAGE");
  });

  it('writes exactly one cache entry under ["communities"]', async () => {
    client.get.mockImplementation(serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]));
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W, queryClient } = wrapper();

    renderHook(() => useMyCommunities(), { wrapper: W });
    await waitFor(() => expect(queryClient.getQueryData(COMMUNITIES_KEY)).toHaveLength(11));

    const communityKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
      .filter((k) => k[0] === "communities");
    expect(communityKeys).toEqual([COMMUNITIES_KEY]);
  });

  it("forwards _skipAuthRedirect only when asked, on its own key", async () => {
    client.get.mockImplementation(serveCommunities([OFF_PAGE_COMMUNITY]));
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W } = wrapper();

    renderHook(() => useMyCommunities({ skipAuthRedirect: true }), { wrapper: W });
    await waitFor(() => expect(communitiesRequests()).toHaveLength(1));

    expect(communitiesRequests()[0][1]._skipAuthRedirect).toBe(true);
  });

  it("sends no _skipAuthRedirect for the ordinary path", async () => {
    client.get.mockImplementation(serveCommunities([OFF_PAGE_COMMUNITY]));
    const { useMyCommunities } = await import("../../hooks/useMyAccount");
    const { W } = wrapper();

    renderHook(() => useMyCommunities(), { wrapper: W });
    await waitFor(() => expect(communitiesRequests()).toHaveLength(1));

    expect(communitiesRequests()[0][1]).not.toHaveProperty("_skipAuthRedirect");
  });
});

describe("useCommunityMap — notification community resolution", () => {
  it("resolves a notification whose community is beyond page 1", async () => {
    client.get.mockImplementation(serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]));
    const { useCommunityMap } = await import("../../hooks/useCommunityMap");
    const { W } = wrapper();

    const { result } = renderHook(() => useCommunityMap(), { wrapper: W });
    await waitFor(() => expect(result.current.get(OFF_PAGE_COMMUNITY.id)?.slug).toBe("off-page"));
    expect(requestedPageNumbers()).toEqual([1, 2]);
  });
});

describe("useJoinApprovalWatcher — approval landing off page 1", () => {
  it("detects an approval for a community beyond page 1", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // A pending request for the off-page community; the membership only becomes
    // visible once the walk reaches page 2. (Key is useJoinApproval's own
    // PENDING_KEY -- glass_pending_join_requests.)
    localStorage.setItem(
      "glass_pending_join_requests",
      JSON.stringify([
        { id: OFF_PAGE_COMMUNITY.id, slug: OFF_PAGE_COMMUNITY.slug, requestedAt: Date.now() },
      ]),
    );
    client.get.mockImplementation(serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]));
    const { useJoinApprovalWatcher } = await import("../../hooks/useJoinApproval");
    const { W } = wrapper();

    const { result } = renderHook(() => useJoinApprovalWatcher(), { wrapper: W });
    await vi.waitFor(() => expect(result.current.approved).toHaveLength(1));
    vi.useRealTimers();

    expect(result.current.approved[0]).toMatchObject({
      communitySlug: "off-page",
      communityId: OFF_PAGE_COMMUNITY.id,
    });
    expect(requestedPageNumbers()).toEqual([1, 2]);
  });
});

describe("useTransactions — community logo resolution", () => {
  it("resolves an off-page community's logo onto its transaction", async () => {
    const serveList = serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]);
    client.get.mockImplementation((url, config) => {
      if (url === "/communities/me") return serveList(url, config);
      // The transaction list itself: one transaction belonging to the off-page
      // community, with no logo on the payload, so only the community list can
      // supply one.
      if (url === "/finance/transactions/me") {
        return Promise.resolve({
          data: {
            data: {
              content: [
                {
                  id: "t-1",
                  amount: 1000,
                  status: "SUCCESSFUL",
                  paidAt: "2026-01-01T10:00:00.000Z",
                  // Nested community, which is the shape shapeTransaction reads
                  // (`raw.community?.slug`), so communitySlug reaches the
                  // enrichment map below.
                  community: { slug: "off-page", name: "Off Page Community" },
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    const { useTransactions } = await import("../../hooks/useTransactions");
    const { W } = wrapper();

    const { result } = renderHook(() => useTransactions(), { wrapper: W });

    // The enriched transaction picks up the off-page community's logo, which
    // a first-page-only list could not supply.
    await waitFor(() => {
      const enriched = result.current.data?.find((t) => t.communitySlug === "off-page");
      expect(enriched?.communityLogo?.url).toBe(
        "https://res.cloudinary.com/demo/image/upload/v1/off-page.png",
      );
    });
    expect(requestedPageNumbers()).toEqual([1, 2]);
  });
});

describe("useTransactionDetail — receipt logo resolution", () => {
  it("gates on transactionId and resolves an off-page community", async () => {
    const serveList = serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]);
    client.get.mockImplementation((url, config) => {
      if (url === "/communities/me") return serveList(url, config);
      if (url === "/finance/transactions/me/tx-off-page") {
        return Promise.resolve({
          data: {
            data: {
              id: "tx-off-page",
              amount: 1000,
              status: "SUCCESSFUL",
              paidAt: "2026-01-01T10:00:00.000Z",
              community: { slug: "off-page", name: "Off Page Community" },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    const { useTransactionDetail } = await import("../../hooks/useTransactionDetail");
    const { W } = wrapper();

    const { result } = renderHook(() => useTransactionDetail("tx-off-page"), { wrapper: W });
    await waitFor(() => expect(result.current.data?.communitySlug).toBe("off-page"));

    expect(requestedPageNumbers()).toEqual([1, 2]);
  });

  it("does not fetch the community list when there is no transactionId", async () => {
    client.get.mockImplementation((url, config) =>
      url === "/communities/me"
        ? serveCommunities([OFF_PAGE_COMMUNITY])(url, config)
        : Promise.resolve({ data: { data: {} } }),
    );
    const { useTransactionDetail } = await import("../../hooks/useTransactionDetail");
    const { W } = wrapper();

    renderHook(() => useTransactionDetail(null), { wrapper: W });
    await new Promise((r) => setTimeout(r, 30));

    expect(communitiesRequests()).toHaveLength(0);
  });
});

describe("useMainPayments — active community resolution", () => {
  it("resolves an ACTIVE community beyond page 1 instead of falling back", async () => {
    // Stored selection names the off-page community. Before this change it
    // could not be found, so the hook fell through to activeCommunities[0] --
    // the first community the backend happened to order first.
    localStorage.setItem(
      "glass_member_community",
      JSON.stringify({ id: OFF_PAGE_COMMUNITY.id, slug: OFF_PAGE_COMMUNITY.slug }),
    );
    client.get.mockImplementation(serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]));
    const { usePayments } = await import("../../hooks/payments/useMainPayments");
    const { W } = wrapper();

    const { result } = renderHook(() => usePayments(), { wrapper: W });
    await waitFor(() => expect(result.current.data.community).toBeTruthy());

    expect(result.current.data.community.slug).toBe("off-page");
    // It found the community the member actually selected, not [0] of the
    // first page.
    expect(result.current.communityCount).toBe(11);
    expect(requestedPageNumbers()).toEqual([1, 2]);
  });

  it("still refetches on mount even with a warm cache", async () => {
    // refetchOnMount: "always" is load-bearing and must survive the migration to
    // the shared hook: accepting an invite invalidates ["communities"] while
    // Home is unmounted, so a member landing on Home would otherwise render
    // with the pre-accept list and fail to resolve their new community.
    const serveList = serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY]);
    client.get.mockImplementation((url, config) => {
      if (url === "/communities/me") return serveList(url, config);
      if (url === "/user/me") {
        return Promise.resolve({ data: { data: { id: "u1", email: "a@b.c" } } });
      }
      return Promise.resolve({ data: { data: { content: [] } } });
    });

    const { usePayments } = await import("../../hooks/payments/useMainPayments");
    // A FRESH client with a long staleTime, so "is the cached entry fresh?" is
    // the only thing that can decide whether a remount refetches. With the
    // suite's default staleTime: 0 every entry is instantly stale and the
    // assertion would pass no matter what refetchOnMount said.
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 5 },
      },
    });
    const W = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const first = renderHook(() => usePayments(), { wrapper: W });
    await waitFor(() => expect(first.result.current.data.community).toBeTruthy());
    const afterFirstMount = communitiesRequests().length;
    first.unmount();

    await act(async () => {
      renderHook(() => usePayments(), { wrapper: W });
    });

    // Fresh cache (well inside the 5-minute staleTime) yet the list is refetched.
    await waitFor(() => expect(communitiesRequests().length).toBeGreaterThan(afterFirstMount));
  });
});

describe("DiscoverCommunities — membership detection", () => {
  it("does not offer Join for a community the user already belongs to off page 1", async () => {
    const { render, screen, fireEvent } = await import("@testing-library/react");
    const { MemoryRouter } = await import("react-router-dom");
    const DiscoverCommunities = (await import("../../pages/memberApp/DiscoverCommunities")).default;
    client.get.mockImplementation((url, config) => {
      if (url === "/communities/me") {
        return serveCommunities([...TEN_MEMBERSHIPS, OFF_PAGE_COMMUNITY])(url, config);
      }
      if (url === "/public/communities/search") {
        return Promise.resolve({
          data: {
            data: {
              content: [
                { id: "p-1", name: "Off Page Community", slug: "off-page" },
                { id: "p-2", name: "Brand New", slug: "brand-new" },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    const W = wrapper().W;
    render(
      <W>
        <MemoryRouter>
          <DiscoverCommunities />
        </MemoryRouter>
      </W>,
    );

    // Discover only searches once the query is longer than one character.
    fireEvent.change(screen.getByPlaceholderText("Search Community"), {
      target: { value: "comm" },
    });

    // "Already a member" for the off-page membership, and a genuine join
    // affordance only for the community the member is actually not in.
    await waitFor(() => expect(screen.getByText("Already a member")).toBeTruthy());
    expect(screen.getByText("Request To Join")).toBeTruthy();
    expect(requestedPageNumbers()).toEqual([1, 2]);
  });
});
