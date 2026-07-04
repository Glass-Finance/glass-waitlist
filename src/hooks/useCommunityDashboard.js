import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { getCommunityMembers } from "../api/communities";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/{communityIdentifier}
// Already includes `metrics` — totalMembers, inactiveMembers, collectedAmount,
// outstandingAmount, activePaymentLinks, activeRecurringPlans — no separate
// balances or members-count call needed for the dashboard stat cards.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCommunity(id) {
  const res = await client.get(`/communities/${id}`);
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/{communityIdentifier}/members
// Full member list — used for the Member Payments table and the "Applies To"
// count in the Create Payment Plan modal.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchMembers(id) {
  // Use getCommunityMembers so we get status=ACTIVE by default —
  // the raw endpoint includes soft-deleted members and inflates the count.
  const res = await getCommunityMembers(id);
  const data = res.data?.data;
  return Array.isArray(data) ? data : (data?.content ?? []);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/{communityIdentifier}/activity
// Real audit-log feed (event/description/actor/result/occurredAt) — replaces
// deriving "recent activity" from the first few transactions, which only
// ever showed payments and never member joins, reminders, etc.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchActivity(id) {
  const res = await client.get(`/communities/${id}/activity`, { params: { pageSize: 6 } });
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/{communityIdentifier}/finance/transactions
// ─────────────────────────────────────────────────────────────────────────────
async function fetchTransactions(id) {
  // Paginated server-side — request a large page so the "Recent Activity"
  // sort below isn't silently working off a single default-sized page.
  const res = await client.get(`/communities/${id}/finance/transactions`, { params: { pageSize: 1000 } });
  return res.data.data;
}

/**
 * useCommunityDashboard
 * Fetches everything the admin dashboard needs, in parallel.
 * communityId — the slug or UUID of the selected community.
 */
export function useCommunityDashboard(communityId) {
  const enabled = !!communityId;

  // ── Community detail — gives us metrics in one call ─────────────────────────
  const communityQuery = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => fetchCommunity(communityId),
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: "always",
  });

  // ── Members list — for the table, not just the count ────────────────────────
  // "members", "all" sub-key avoids cache collision with useCommunityMembers /
  // useMembersWithPayments, whose queryFns return a pre-unwrapped flat array
  // while this one returns raw res.data.data — mixing them breaks .map() on
  // the Members page when navigating from the dashboard without a reload.
  const membersQuery = useQuery({
    queryKey: ["community", communityId, "members", "all"],
    queryFn: () => fetchMembers(communityId),
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnMount: "always",
    select: (data) => {
      const list = Array.isArray(data)
        ? data
        : (data?.content ?? data?.members ?? []);
      return list;
    },
  });

  // ── Transactions ──────────────────────────────────────────────────────────────
  // Same cache-isolation reason as members above — useMembersWithPayments also
  // uses ["community", communityId, "transactions"] with a different raw shape.
  const transactionsQuery = useQuery({
    queryKey: ["community", communityId, "transactions", "all"],
    queryFn: () => fetchTransactions(communityId),
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: "always",
    select: (data) => {
      const list = Array.isArray(data)
        ? data
        : (data?.content ?? data?.transactions ?? []);
      return [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    },
  });

  // ── Activity feed — separate from the rest so its skeleton doesn't wait
  // on members/transactions, and a failure here doesn't blank the page ──────
  const activityQuery = useQuery({
    queryKey: ["community", communityId, "activity"],
    queryFn: () => fetchActivity(communityId),
    enabled,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    select: (data) => data?.content ?? [],
  });

  const isLoading =
    communityQuery.isLoading ||
    membersQuery.isLoading ||
    transactionsQuery.isLoading;

  const error =
    communityQuery.error ||
    membersQuery.error ||
    transactionsQuery.error;

  // ── Stat-card friendly shape, pulled straight from community.metrics ────────
  const metrics = communityQuery.data?.metrics ?? {};

  // Compute collected from actual successful transactions — backend's
  // collectedAmount only tracks settlements and returns 0 even after payments.
  const SUCCESS_STATUSES = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);
  const computedCollected = (transactionsQuery.data ?? [])
    .filter((t) => SUCCESS_STATUSES.has((t.status ?? "").toUpperCase()))
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const balances = {
    totalContributions: computedCollected,
    outstanding: metrics.outstandingAmount ?? 0,
    currency: metrics.currency ?? "NGN",
  };

  const members = {
    list: membersQuery.data ?? [],
    // Prefer the actual fetched list count — community metrics can lag after
    // member deletions. Fall back to metrics only while the list is loading.
    total: membersQuery.data != null
      ? membersQuery.data.length
      : (metrics.totalMembers ?? 0),
    inactive: metrics.inactiveMembers ?? 0,
    overdue: metrics.overdueMembers ?? 0,
  };

  return {
    community: communityQuery.data,
    balances,
    members,
    transactions: transactionsQuery.data ?? [],
    activity: {
      list: activityQuery.data ?? [],
      isLoading: activityQuery.isLoading,
    },
    isLoading,
    error,
    queries: {
      community: communityQuery,
      members: membersQuery,
      transactions: transactionsQuery,
      activity: activityQuery,
    },
  };
}
