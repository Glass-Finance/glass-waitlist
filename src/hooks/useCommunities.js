import { useQuery, useQueries } from "@tanstack/react-query";
import client from "../api/client";
import { getCommunity, fetchAllCommunityMembers } from "../api/communities";
import { fetchAllCommunityTransactions } from "../api/transactions";
import { searchPublicCommunities } from "../api/communities";
import { isSuccessfulStatus } from "../utils/paymentStatus";
import { normalizeImageObject } from "../utils/normalizeImageFields";

// Safety valve for the page walk in fetchMyCommunities() below, in the same
// bounded-loop style useExportJob.js uses for its poll loop (a named MAX_*
// constant plus a counter). The termination signals below are three independent
// guards, so this is the backstop for a backend or proxy that reports
// `last: false` on its final page, or a totalPages that never converges --
// without it a malformed response would walk forever.
const MAX_PAGES = 200;

// GET /api/v1/communities/me
// Returns a PAGINATED envelope: { content: [...], pageNumber, pageSize, totalElements, totalPages, last }
// Each community object includes memberRole, memberStatus, owned, logo{url,...}
// -- but NOT a populated `metrics` object; that only comes back from the
// single-community detail endpoint (see useCommunitiesWithMetrics below).
//
// Walks every page and concatenates the results, because this endpoint defaults
// to AppConstant.PAGE_SIZE = 10 and every consumer here treats the list as
// complete. A user in more than 10 communities silently lost the rest of them:
// CommunitiesHome rendered an under-full grid, Topbar's notification panel and
// useNotifications could not resolve a community off the first page, and
// Sidebar's `adminCommunities.length === 1` inference could fire for an admin
// whose other administered communities were simply not in the response.
//
// pageNumber is 1-based because the backend's is: createPageable() does
// PageRequest.of(pageNumber - 1, ...), so 0 becomes PageRequest.of(-1, ...) and
// the request is rejected with 400 "Illegal Argument Entered". First request is
// explicitly page 1; pageSize is left alone so the backend's own default (or a
// caller-supplied one) still governs.
//
// Sequentially, because page N+1 does not exist until page N reports whether
// one is left. If a later page fails the rejection propagates out of this
// function and React Query surfaces the error like any other failed query; no
// partial result is cached and retry is left to React Query's own config.
//
// The accumulated result is a single envelope describing the whole collection
// -- totalPages 1, last true -- so nothing downstream can mistake it for a
// partial page and request more. Only that one value enters the cache; the
// intermediate responses are not cached separately and need not be, since no
// observer ever asks for a single page of this list.
//
// A response with no pagination metadata at all ({ content: [...] }, which
// several tests and a bare-array backend both produce) is treated as a complete
// single-page result rather than prompting a phantom second request.
async function fetchMyCommunities(params = {}) {
  const aggregated = [];
  let firstPage = null;
  let totalElements = 0;
  let pageSize = 0;
  let pageNumber = 1;

  for (let attempt = 1; attempt <= MAX_PAGES; attempt += 1) {
    const res = await client.get("/communities/me", {
      params: { ...params, pageNumber },
    });
    const page = res.data.data ?? {};

    if (firstPage === null) {
      firstPage = page;
      totalElements = page.totalElements ?? 0;
      pageSize = page.pageSize ?? 0;
    }
    aggregated.push(...(page.content ?? []));

    // `last` is the backend's own answer and the primary signal. `totalPages`
    // is the second, for a response that omits `last`. A missing `last` on the
    // first page means the payload carried no pagination metadata at all, so it
    // is a complete result and asking for page 2 would be wrong. An empty
    // result reports totalPages 0, and 2 >= 0 stops the walk immediately.
    if (page.last === true) break;
    if (page.last === undefined && page.totalPages === undefined) break;
    if (pageNumber >= (page.totalPages ?? Number.POSITIVE_INFINITY)) break;
    pageNumber += 1;
  }

  return {
    ...firstPage,
    content: aggregated,
    pageNumber: 1,
    pageSize,
    // The backend total, not `aggregated.length`: a walk cut short by
    // MAX_PAGES has fewer rows than it claims, and the mismatch is the only
    // signal that this list is incomplete.
    totalElements,
    totalPages: 1,
    last: true,
  };
}

export function useCommunities(params = {}) {
  return useQuery({
    queryKey: ["communities", "me", params],
    queryFn: () => fetchMyCommunities(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    select: (data) => {
      const content = data?.content ?? [];
      return {
        // SECURITY: `logo.url` is server-controlled and Sidebar.jsx binds it to
        // <img src>. Normalize here — the shared boundary every observer of
        // ["communities","me"] goes through — rather than at that one sink.
        // A rejected logo becomes null so consumers fall back to initials.
        // Maps to a new object only when a logo actually changed, preserving
        // referential stability for the rest of the community object.
        communities: content.map((c) =>
          c?.logo ? { ...c, logo: normalizeImageObject(c.logo) } : c,
        ),
        totalElements: data?.totalElements ?? content.length,
        totalPages: data?.totalPages ?? 1,
        pageNumber: data?.pageNumber ?? 0,
      };
    },
  });
}

// GET /api/v1/public/communities/search
// Public directory search — no auth-scoped community membership required,
// used by members with zero communities to discover ones to request
// joining. Follows the same { search, page, size } convention as
// getAdminCommunities / getAdminUsers elsewhere in this codebase.
export function usePublicCommunitySearch(search, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["public-communities-search", search],
    queryFn: async () => {
      const res = await searchPublicCommunities({ search, size: 30 });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      // SECURITY: the public directory is a different endpoint from
      // /communities/me, so it needs its own normalization here.
      // DiscoverCommunities renders every result's logo.url directly.
      return list.map((c) => (c?.logo ? { ...c, logo: normalizeImageObject(c.logo) } : c));
    },
    enabled: enabled,
    staleTime: 1000 * 30,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// /communities/me never populates `metrics` per community (totalMembers,
// collectedAmount, overdueMembers, etc.) -- only GET /communities/{id} does,
// same endpoint useCommunityDashboard.js uses for the single-community admin
// page. CommunitiesHome needs real numbers on every card, so this fans out
// one detail fetch per community and merges metrics back onto the list.
// Reuses the ["community", id] query key so it shares cache with
// useCommunityDashboard instead of double-fetching when a community's own
// dashboard has already been visited.
// ─────────────────────────────────────────────────────────────────────────────
export function useCommunitiesWithMetrics(params = {}) {
  const listQuery = useCommunities(params);
  const communities = listQuery.data?.communities ?? [];

  const detailQueries = useQueries({
    queries: communities.map((c) => ({
      queryKey: ["community", c.slug ?? c.id],
      queryFn: async () => (await getCommunity(c.slug ?? c.id)).data.data,
      enabled: !!listQuery.data,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    })),
  });

  // Fetch the ACTIVE member list per community so the card shows the real
  // count — metrics.totalMembers from the backend includes soft-deleted
  // members and is always higher than the true active headcount.
  // Shares the ["community", id, "members"] cache key with useMembersWithPayments
  // so the request is reused when the admin has already visited Members page.
  const memberListQueries = useQueries({
    queries: communities.map((c) => ({
      queryKey: ["community", c.slug ?? c.id, "members"],
      queryFn: () => fetchAllCommunityMembers(c.slug ?? c.id),
      // Only fetch the full member list for communities where the user is an
      // admin/owner — non-admin members get 403 on this endpoint.
      enabled: !!listQuery.data && !!c.owned,
      staleTime: 1000 * 60 * 2,
    })),
  });

  // Fetch transactions per community to compute actual collectedAmount —
  // the backend's metrics.collectedAmount only tracks settlements (transfers
  // to the community's account) and returns 0 even when members have paid.
  // Shares the ["community", id, "transactions"] cache key with useMembersWithPayments.
  const txListQueries = useQueries({
    queries: communities.map((c) => ({
      queryKey: ["community", c.slug ?? c.id, "transactions"],
      queryFn: () => fetchAllCommunityTransactions(c.slug ?? c.id),
      enabled: !!listQuery.data && !!c.owned,
      staleTime: 1000 * 60 * 2,
    })),
  });

  const enriched = communities.map((c, i) => {
    const baseMetrics = detailQueries[i]?.data?.metrics ?? c.metrics ?? {};
    const activeMemberList = memberListQueries[i]?.data;
    const txList = txListQueries[i]?.data;

    const computedCollected =
      txList != null
        ? txList
            .filter((t) => isSuccessfulStatus(t.status))
            .reduce((sum, t) => sum + (t.amount ?? 0), 0)
        : null;

    return {
      ...c,
      metrics: {
        ...baseMetrics,
        totalMembers:
          activeMemberList != null ? activeMemberList.length : (baseMetrics.totalMembers ?? null),
        collectedAmount:
          computedCollected != null ? computedCollected : (baseMetrics.collectedAmount ?? null),
      },
    };
  });

  return {
    ...listQuery,
    data: listQuery.data ? { ...listQuery.data, communities: enriched } : listQuery.data,
    isLoading:
      listQuery.isLoading || (communities.length > 0 && detailQueries.some((q) => q.isLoading)),
  };
}
