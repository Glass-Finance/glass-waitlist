import { useQuery, useQueries } from "@tanstack/react-query";
import { getCommunity, fetchAllCommunityMembers } from "../api/communities";
import { fetchAllCommunityTransactions } from "../api/transactions";
import { searchPublicCommunities } from "../api/communities";
import { fetchCompleteMyCommunities } from "../api/communityList";
import { isSuccessfulStatus } from "../utils/paymentStatus";
import { normalizeImageObject } from "../utils/normalizeImageFields";

// GET /api/v1/communities/me
// Returns a PAGINATED envelope: { content: [...], pageNumber, pageSize, totalElements, totalPages, last }
// Each community object includes memberRole, memberStatus, owned, logo{url,...}
// -- but NOT a populated `metrics` object; that only comes back from the
// single-community detail endpoint (see useCommunitiesWithMetrics below).
//
// This endpoint defaults to AppConstant.PAGE_SIZE = 10 and every consumer here
// treats the list as complete, so the walk for the WHOLE collection lives in
// api/communityList.js and is shared with AuthContext's admin-standing check --
// which cannot use this hook (it runs inside async bootstrap functions) and
// must not own a second copy of the loop. That module documents the walk: 1-based
// page numbers, sequential requests, `last` as the primary stop, MAX_PAGES as
// the backstop, and caller-supplied pageSize preserved.
//
// A caller-supplied `params` still flows through untouched, so this hook keeps
// its `["communities", "me", params]` key and its "params scope the request"
// contract unchanged.
function fetchMyCommunities(params = {}) {
  return fetchCompleteMyCommunities({ params });
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
