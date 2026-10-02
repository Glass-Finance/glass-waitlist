import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { clientGetMock } = vi.hoisted(() => ({ clientGetMock: vi.fn() }));

vi.mock("../../api/client", () => ({ default: { get: clientGetMock } }));
// The metrics fan-out is not what's under test here -- this file is about the
// page walk inside the shared list fetch. Stubbing those api modules keeps the
// focus on /communities/me and stops their requests from polluting call counts.
vi.mock("../../api/communities", () => ({
  getCommunity: vi.fn().mockResolvedValue({ data: { data: { metrics: {} } } }),
  fetchAllCommunityMembers: vi.fn().mockResolvedValue([]),
  searchPublicCommunities: vi.fn().mockResolvedValue({ data: { data: { content: [] } } }),
}));
vi.mock("../../api/transactions", () => ({
  fetchAllCommunityTransactions: vi.fn().mockResolvedValue([]),
}));

const COMMUNITY_KEY = ["communities", "me", {}];

// Must mirror the guard in useCommunities.js. Asserted against MAX_PAGES
// indirectly below rather than imported, because a test that imports the
// constant it is testing cannot catch the constant being wrong.
const EXPECTED_MAX_PAGES = 200;

function community(n) {
  return { id: `comm-${n}`, slug: `comm-${n}`, name: `Community ${n}`, owned: true };
}

// A realistic page of the backend envelope: the backend's PageResponse always
// carries all six fields (PageResponse.java).
function page({ content, pageNumber, pageSize = 10, totalElements, totalPages, last }) {
  return { content, pageNumber, pageSize, totalElements, totalPages, last };
}

function singlePage(items, extra = {}) {
  return page({
    content: items,
    pageNumber: 1,
    totalElements: items.length,
    totalPages: 1,
    last: true,
    ...extra,
  });
}

function createWrapper() {
  // retry: false so the later-page-failure test observes one walk rather than
  // React Query's default retry re-running the whole loop.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function callsToCommunitiesMe() {
  return clientGetMock.mock.calls.filter(([url]) => url === "/communities/me");
}

function requestedPageNumbers() {
  return callsToCommunitiesMe().map(([, config]) => config?.params?.pageNumber);
}

async function renderUseCommunities() {
  const { useCommunities } = await import("../../hooks/useCommunities");
  return renderHook(() => useCommunities(), { wrapper: createWrapper() });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCommunities page walk — single-page responses", () => {
  it("makes exactly one request and preserves existing single-page behavior", async () => {
    const items = [community(1), community(2)];
    clientGetMock.mockResolvedValue({ data: { data: singlePage(items) } });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(1);
    expect(result.current.data.communities).toHaveLength(2);
    expect(result.current.data.communities[0]).toMatchObject({ id: "comm-1", slug: "comm-1" });
    expect(result.current.data.totalElements).toBe(2);
  });

  it("treats a response with no pagination metadata as a complete result", async () => {
    // Several existing tests and mocks return only `{ content: [...] }`. That
    // must not produce a phantom page-2 request.
    clientGetMock.mockResolvedValue({ data: { data: { content: [community(1)] } } });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(1);
    expect(result.current.data.communities).toHaveLength(1);
  });

  it("does not ask for more pages when last is true even if totalPages disagrees", async () => {
    // `last` is the backend's own answer and takes precedence: a stale or wrong
    // totalPages must not trigger a request the backend already said is past.
    clientGetMock.mockResolvedValue({
      data: {
        data: page({
          content: [community(1)],
          pageNumber: 1,
          totalElements: 1,
          totalPages: 7,
          last: true,
        }),
      },
    });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(1);
  });
});

describe("useCommunities page walk — multiple pages", () => {
  it("walks to the last page and concatenates the results", async () => {
    const p1 = [community(1), community(2), community(3)];
    const p2 = [community(4), community(5)];
    clientGetMock
      .mockResolvedValueOnce({
        data: {
          data: page({ content: p1, pageNumber: 1, totalElements: 5, totalPages: 2, last: false }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: page({ content: p2, pageNumber: 2, totalElements: 5, totalPages: 2, last: true }),
        },
      });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(2);
    expect(requestedPageNumbers()).toEqual([1, 2]);
    expect(result.current.data.communities.map((c) => c.id)).toEqual([
      "comm-1",
      "comm-2",
      "comm-3",
      "comm-4",
      "comm-5",
    ]);
  });

  it("uses 1-based page numbers and never sends pageNumber=0", async () => {
    // The backend's createPageable() does PageRequest.of(pageNumber - 1, ...),
    // so 0 becomes PageRequest.of(-1, ...) and the request is rejected with
    // 400 "Illegal Argument Entered". Same 1-based convention PR #80 applied to
    // the groups list.
    const pages = 4;
    for (let i = 1; i <= pages; i += 1) {
      clientGetMock.mockResolvedValueOnce({
        data: {
          data: page({
            content: [community(i)],
            pageNumber: i,
            totalElements: pages,
            totalPages: pages,
            last: i === pages,
          }),
        },
      });
    }

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestedPageNumbers()).toEqual([1, 2, 3, 4]);
    expect(requestedPageNumbers()).not.toContain(0);
  });

  it("keeps the caller-supplied pageSize rather than overriding it", async () => {
    // COMMUNITY_PAGE_SIZE is a DEFAULT the walk proposes, not an override: the
    // caller spread lands after it, so an explicit pageSize still wins.
    clientGetMock.mockResolvedValue({ data: { data: singlePage([community(1)]) } });

    const { useCommunities } = await import("../../hooks/useCommunities");
    renderHook(() => useCommunities({ pageSize: 5 }), { wrapper: createWrapper() });
    await waitFor(() => expect(callsToCommunitiesMe()).toHaveLength(1));

    const params = callsToCommunitiesMe()[0][1].params;
    expect(params.pageSize).toBe(5);
    expect(params.pageNumber).toBe(1);
  });

  it("requests COMMUNITY_PAGE_SIZE when the caller supplies no pageSize", async () => {
    // AppConstant.PAGE_SIZE = 10 is the backend's default-when-absent, not a
    // maximum, so the walk asks for 200 to reach the same complete list in
    // ceil(N/200) round trips instead of ceil(N/10). 200 is already in
    // production use on /finance/obligations/me and /finance/transactions/me.
    clientGetMock.mockResolvedValue({ data: { data: singlePage([community(1)]) } });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const params = callsToCommunitiesMe()[0][1].params;
    expect(params).toEqual({ pageSize: 200, pageNumber: 1 });
  });

  it("requests pages sequentially, never in parallel", async () => {
    // Page N+1 cannot be requested until page N has reported whether another
    // page exists, so the second request must not be in flight when the first
    // is still outstanding.
    let inFlight = 0;
    let maxConcurrent = 0;
    clientGetMock.mockImplementation(async () => {
      inFlight += 1;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      const pageNumber = clientGetMock.mock.calls.length;
      return {
        data: {
          data: page({
            content: [community(pageNumber)],
            pageNumber,
            totalElements: 3,
            totalPages: 3,
            last: pageNumber === 3,
          }),
        },
      };
    });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(3);
    expect(maxConcurrent).toBe(1);
  });
});

describe("useCommunities page walk — aggregated envelope", () => {
  it("reports a single-page envelope describing the whole collection", async () => {
    clientGetMock
      .mockResolvedValueOnce({
        data: {
          data: page({
            content: [community(1), community(2)],
            pageNumber: 1,
            totalElements: 3,
            totalPages: 2,
            last: false,
          }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: page({
            content: [community(3)],
            pageNumber: 2,
            totalElements: 3,
            totalPages: 2,
            last: true,
          }),
        },
      });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { data } = result.current;
    // Nothing downstream may mistake this for a partial page.
    expect(data.totalPages).toBe(1);
    expect(data.pageNumber).toBe(1);
    // The backend total is preserved, and it matches what was accumulated.
    expect(data.totalElements).toBe(3);
    expect(data.communities).toHaveLength(3);
  });

  it("keeps the backend totalElements when the walk is cut short by MAX_PAGES", async () => {
    // If a walk is ever truncated by the cap, aggregated.length is below the
    // backend total. Preserving the backend number is the only signal left that
    // the list is incomplete, so it must not be replaced by the row count.
    clientGetMock.mockImplementation(async () => ({
      data: {
        data: page({
          content: [community(1)],
          pageNumber: 1,
          totalElements: 5000,
          totalPages: 5000,
          last: false,
        }),
      },
    }));

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 20000 });

    expect(callsToCommunitiesMe().length).toBe(EXPECTED_MAX_PAGES);
    expect(result.current.data.totalElements).toBe(5000);
    expect(result.current.data.communities.length).toBeLessThan(5000);
  });
});

describe("useCommunities page walk — empty account", () => {
  it("stops after the first request with no error", async () => {
    // Spring's Page reports totalPages 0 for an empty result, so the walk must
    // not treat that as "one more page to fetch".
    clientGetMock.mockResolvedValue({
      data: {
        data: page({ content: [], pageNumber: 1, totalElements: 0, totalPages: 0, last: true }),
      },
    });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(1);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data.communities).toEqual([]);
    expect(result.current.data.totalElements).toBe(0);
  });

  it("stops after the first request when an empty result reports last: false", async () => {
    // totalPages 0 is itself the termination signal; pageNumber 1 >= 0 must end
    // the walk even though last is not set.
    clientGetMock.mockResolvedValue({
      data: {
        data: page({ content: [], pageNumber: 1, totalElements: 0, totalPages: 0, last: false }),
      },
    });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(1);
    expect(result.current.data.communities).toEqual([]);
  });
});

describe("useCommunities page walk — failure handling", () => {
  it("surfaces a later-page failure and stops walking", async () => {
    clientGetMock
      .mockResolvedValueOnce({
        data: {
          data: page({
            content: [community(1)],
            pageNumber: 1,
            totalElements: 2,
            totalPages: 2,
            last: false,
          }),
        },
      })
      .mockRejectedValueOnce(new Error("page 2 failed"));

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Stops at the failure -- no page 3+, and no repeated generation of the
    // same page as React Query retries.
    expect(callsToCommunitiesMe()).toHaveLength(2);
    expect(requestedPageNumbers()).toEqual([1, 2]);
    expect(result.current.error.message).toBe("page 2 failed");
  });

  it("surfaces a failure on the very first request", async () => {
    clientGetMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(1);
  });
});

describe("useCommunities page walk — MAX_PAGES guard", () => {
  it("cannot loop forever when the backend never reports a final page", async () => {
    // A backend or proxy that answers `last: false` forever, or a totalPages
    // that never converges, must not become an unbounded loop. Without the cap
    // this test would never settle.
    clientGetMock.mockImplementation(async () => ({
      data: {
        data: page({
          content: [community(1)],
          pageNumber: 1,
          totalElements: Number.MAX_SAFE_INTEGER,
          totalPages: Number.MAX_SAFE_INTEGER,
          last: false,
        }),
      },
    }));

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 30000 });

    expect(callsToCommunitiesMe()).toHaveLength(EXPECTED_MAX_PAGES);
    expect(requestedPageNumbers()[0]).toBe(1);
    expect(requestedPageNumbers()).not.toContain(0);
  });
});

describe("useCommunities page walk — the truncation this fixes", () => {
  it("exposes all 11 communities rather than silently stopping at 10", async () => {
    // The backend's default page size is 10. An admin in 11 communities used to
    // get 10, and Sidebar's `adminCommunities.length === 1` inference could then
    // fire for an admin whose other administered communities were simply not in
    // the response -- the exact guess PR #94 was written to refuse.
    const all = Array.from({ length: 11 }, (_, i) => community(i + 1));
    clientGetMock.mockImplementation(async (_url, config) => {
      const pageNumber = config?.params?.pageNumber ?? 1;
      const start = (pageNumber - 1) * 10;
      const slice = all.slice(start, start + 10);
      return {
        data: {
          data: page({
            content: slice,
            pageNumber,
            totalElements: all.length,
            totalPages: 2,
            last: pageNumber >= 2,
          }),
        },
      };
    });

    const { result } = await renderUseCommunities();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(callsToCommunitiesMe()).toHaveLength(2);
    expect(result.current.data.communities).toHaveLength(11);
    expect(result.current.data.communities.filter((c) => c.owned)).toHaveLength(11);
    expect(result.current.data.totalElements).toBe(11);
  });

  it("caches only the accumulated result, under the pre-existing key", async () => {
    // No new cache key for intermediate pages: one entry holding the whole
    // collection. A per-page key would leave entries no observer ever reads.
    const p1 = [community(1)];
    const p2 = [community(2)];
    clientGetMock
      .mockResolvedValueOnce({
        data: {
          data: page({ content: p1, pageNumber: 1, totalElements: 2, totalPages: 2, last: false }),
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: page({ content: p2, pageNumber: 2, totalElements: 2, totalPages: 2, last: true }),
        },
      });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
    });
    const { useCommunities } = await import("../../hooks/useCommunities");
    renderHook(() => useCommunities(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => expect(queryClient.getQueryData(COMMUNITY_KEY)?.content).toHaveLength(2));

    // Exactly one cache entry for this endpoint, and it holds both pages.
    const communityKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
      .filter((key) => key[0] === "communities");
    expect(communityKeys).toHaveLength(1);
    expect(communityKeys[0]).toEqual(COMMUNITY_KEY);
  });
});
