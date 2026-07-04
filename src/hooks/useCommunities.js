import { useQuery, useQueries } from "@tanstack/react-query";
import client from "../api/client";
import { getCommunity, getCommunityMembers } from "../api/communities";
import { getCommunityTransactions } from "../api/transactions";

// GET /api/v1/communities/me
// Returns a PAGINATED envelope: { content: [...], pageNumber, pageSize, totalElements, totalPages, last }
// Each community object includes memberRole, memberStatus, owned, logo{url,...}
// -- but NOT a populated `metrics` object; that only comes back from the
// single-community detail endpoint (see useCommunitiesWithMetrics below).
async function fetchMyCommunities(params = {}) {
  const res = await client.get("/communities/me", { params });
  return res.data.data; // { content, pageNumber, pageSize, totalElements, totalPages, last }
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
        communities: content,
        totalElements: data?.totalElements ?? content.length,
        totalPages: data?.totalPages ?? 1,
        pageNumber: data?.pageNumber ?? 0,
      };
    },
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
      queryFn: async () => {
        const res = await getCommunityMembers(c.slug ?? c.id);
        const data = res.data?.data;
        return Array.isArray(data) ? data : (data?.content ?? []);
      },
      enabled: !!listQuery.data,
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
      queryFn: async () => {
        const res = await getCommunityTransactions(c.slug ?? c.id);
        const data = res.data?.data;
        return Array.isArray(data) ? data : (data?.content ?? []);
      },
      enabled: !!listQuery.data,
      staleTime: 1000 * 60 * 2,
    })),
  });

  const SUCCESS_STATUSES = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);

  const enriched = communities.map((c, i) => {
    const baseMetrics = detailQueries[i]?.data?.metrics ?? c.metrics ?? {};
    const activeMemberList = memberListQueries[i]?.data;
    const txList = txListQueries[i]?.data;

    const computedCollected = txList != null
      ? txList
          .filter((t) => SUCCESS_STATUSES.has((t.status ?? "").toUpperCase()))
          .reduce((sum, t) => sum + (t.amount ?? 0), 0)
      : null;

    return {
      ...c,
      metrics: {
        ...baseMetrics,
        totalMembers: activeMemberList != null
          ? activeMemberList.length
          : (baseMetrics.totalMembers ?? null),
        collectedAmount: computedCollected != null
          ? computedCollected
          : (baseMetrics.collectedAmount ?? null),
      },
    };
  });

  return {
    ...listQuery,
    data: listQuery.data ? { ...listQuery.data, communities: enriched } : listQuery.data,
    isLoading: listQuery.isLoading || (communities.length > 0 && detailQueries.some((q) => q.isLoading)),
  };
}