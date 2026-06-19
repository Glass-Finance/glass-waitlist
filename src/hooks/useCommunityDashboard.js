import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

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
  const res = await client.get(`/communities/${id}/members`);
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/{communityIdentifier}/finance/transactions
// ─────────────────────────────────────────────────────────────────────────────
async function fetchTransactions(id) {
  const res = await client.get(`/communities/${id}/finance/transactions`);
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/{communityIdentifier}/finance/obligations
// ─────────────────────────────────────────────────────────────────────────────
async function fetchObligations(id) {
  const res = await client.get(`/communities/${id}/finance/obligations`);
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
  });

  // ── Members list — for the table, not just the count ────────────────────────
  const membersQuery = useQuery({
    queryKey: ["community", communityId, "members"],
    queryFn: () => fetchMembers(communityId),
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    select: (data) => {
      const list = Array.isArray(data)
        ? data
        : (data?.content ?? data?.members ?? []);
      return list;
    },
  });

  // ── Transactions ──────────────────────────────────────────────────────────────
  const transactionsQuery = useQuery({
    queryKey: ["community", communityId, "transactions"],
    queryFn: () => fetchTransactions(communityId),
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    select: (data) => {
      const list = Array.isArray(data)
        ? data
        : (data?.content ?? data?.transactions ?? []);
      return [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    },
  });

  // ── Obligations (payment plans) ─────────────────────────────────────────────
  const obligationsQuery = useQuery({
    queryKey: ["community", communityId, "obligations"],
    queryFn: () => fetchObligations(communityId),
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    select: (data) => {
      const list = Array.isArray(data)
        ? data
        : (data?.content ?? data?.obligations ?? []);
      return list;
    },
  });

  const isLoading =
    communityQuery.isLoading ||
    membersQuery.isLoading ||
    transactionsQuery.isLoading ||
    obligationsQuery.isLoading;

  const error =
    communityQuery.error ||
    membersQuery.error ||
    transactionsQuery.error ||
    obligationsQuery.error;

  // ── Stat-card friendly shape, pulled straight from community.metrics ────────
  const metrics = communityQuery.data?.metrics ?? {};
  const balances = {
    totalContributions: metrics.collectedAmount ?? 0,
    outstanding: metrics.outstandingAmount ?? 0,
    currency: metrics.currency ?? "NGN",
  };

  const members = {
    list: membersQuery.data ?? [],
    total: metrics.totalMembers ?? membersQuery.data?.length ?? 0,
    inactive: metrics.inactiveMembers ?? 0,
  };

  return {
    community: communityQuery.data,
    balances,
    members,
    transactions: transactionsQuery.data ?? [],
    obligations: obligationsQuery.data ?? [],
    isLoading,
    error,
    queries: {
      community: communityQuery,
      members: membersQuery,
      transactions: transactionsQuery,
      obligations: obligationsQuery,
    },
  };
}
