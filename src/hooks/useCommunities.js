import { useQuery, useQueries } from "@tanstack/react-query";
import { getCommunity, fetchAllCommunityMembers } from "../api/communities";
import { fetchAllCommunityTransactions } from "../api/transactions";
import { searchPublicCommunities } from "../api/communities";
import { fetchCompleteMyCommunities } from "../api/communityList";
import { isSuccessfulStatus } from "../utils/paymentStatus";
import { isCommunityAdmin } from "../utils/communityRole";
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

  // Fetch the ACTIVE member rows per community.
  //
  // NOT the count source. The count comes from metrics.activeMembers below —
  // an authoritative server-side COUNT over ACTIVE rows, with no page limit.
  // This list previously supplied the count via `.length`, but it was a single
  // un-paginated request inheriting the backend's default pageSize of 10, so
  // every community above 10 active members displayed "10 Members" forever.
  // It stays because it warms the ["community", id, "members"] cache key that
  // useMembersWithPayments and useCommunityMembers also read, and because it is
  // the fallback count when metrics are unavailable.
  //
  // metrics.totalMembers is deliberately NOT used as the active count: on the
  // backend it is active + inactive + suspended + exited, so it counts
  // soft-deleted (EXITED) members and is always higher than the true active
  // headcount. Use activeMembers, which is ACTIVE only.
  //
  // Shares the ["community", id, "members"] cache key with useMembersWithPayments
  // so the request is reused when the admin has already visited Members page.
  const memberListQueries = useQueries({
    queries: communities.map((c) => ({
      queryKey: ["community", c.slug ?? c.id, "members"],
      queryFn: () => fetchAllCommunityMembers(c.slug ?? c.id),
      // Gated on isCommunityAdmin, NOT c.owned. The backend authorizes
      // community.members.read for COMMUNITY_OWNER *and* COMMUNITY_ADMIN
      // (V2 seed; V72 folds the other staff roles into COMMUNITY_ADMIN), so
      // `owned` under-fetched for a promoted admin: they fell through to
      // metrics.totalMembers, which counts inactive/suspended/exited members,
      // and so the same community showed a different headcount to an owner than
      // to an admin. A plain member is still excluded — the endpoint is
      // permission-gated server-side and would 403.
      enabled: !!listQuery.data && isCommunityAdmin(c),
      staleTime: 1000 * 60 * 2,
    })),
  });

  // Fetch transactions per community to compute a client-side collectedAmount.
  //
  // HISTORY: this fan-out was a workaround for an older backend gap. Back then
  // metrics.collectedAmount summed obligations only, so a community collecting
  // via payment links that had no obligation attached read as 0 even when
  // members had paid. That gap was closed in the backend (the "update collection
  // metrics" change, 2026-09-02), which added the unallocated successful
  // payment-link term. collectedAmount now covers obligations PLUS unallocated
  // successful payment-link transactions — it does NOT count settlements, which
  // live in a separate table and are never part of any Transaction row.
  //
  // TRADE-OFF, not a fix: this fetch is a single page (pageSize:1000, no
  // pageNumber), so above 1000 transactions it silently drops the oldest rows
  // and the client sum can UNDERCOUNT. metrics.collectedAmount has no such
  // limit. Whether this leg is still worth its request cost is an open
  // question — it is deliberately left in place, and no claim is made here that
  // it is safe to remove. The populated backend metric and this client sum have
  // not yet been compared against real production data.
  //
  // Shares the ["community", id, "transactions"] cache key with useMembersWithPayments.
  const txListQueries = useQueries({
    queries: communities.map((c) => ({
      queryKey: ["community", c.slug ?? c.id, "transactions"],
      queryFn: () => fetchAllCommunityTransactions(c.slug ?? c.id),
      // Same predicate as the members block above, and for the same reason:
      // community.transactions.read is granted to COMMUNITY_ADMIN as well as
      // COMMUNITY_OWNER, so gating on `owned` left a promoted admin's
      // "Total Collected" on the backend metric while an owner of the very same
      // community got the client-computed sum — two different numbers for one
      // community depending only on who is looking.
      enabled: !!listQuery.data && isCommunityAdmin(c),
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
        // ACTIVE count. metrics.activeMembers is authoritative and
        // permission-gated exactly like the rest of `metrics`, so for a plain
        // member it is absent — as is `activeMemberList`, since this fan-out is
        // admin-only — and the count stays null, which the card renders as "no
        // count shown". Unchanged from before for that path. The member-list
        // length is only a fallback for an admin whose detail request failed.
        totalMembers:
          baseMetrics.activeMembers ?? (activeMemberList != null ? activeMemberList.length : null),
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
