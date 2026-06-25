import { useQuery } from "@tanstack/react-query";
import { getCommunityMembers } from "../api/communities";
import { getCommunityObligations, getCommunityTransactions } from "../api/transactions";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

function memberIdsMatch(member, ref) {
  if (!ref) return false;
  const refId = ref.id ?? ref;
  return (
    member.id === refId ||
    member.user?.id === refId ||
    member.user?.id === ref.user?.id
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Joins the member list with community-wide obligations + transactions to
// produce the per-member aggregates the Members table and member detail page
// need: plan count, "X/Y Paid" status, last payment date.
// ─────────────────────────────────────────────────────────────────────────────
export function useMembersWithPayments(communityId) {
  const enabled = !!communityId;

  const membersQuery = useQuery({
    queryKey: ["community", communityId, "members"],
    queryFn: async () => unwrapList(await getCommunityMembers(communityId)),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const obligationsQuery = useQuery({
    queryKey: ["community", communityId, "obligations"],
    queryFn: async () => unwrapList(await getCommunityObligations(communityId)),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const transactionsQuery = useQuery({
    queryKey: ["community", communityId, "transactions"],
    queryFn: async () => unwrapList(await getCommunityTransactions(communityId)),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const members = membersQuery.data ?? [];
  const obligations = obligationsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  const enriched = members.map((member) => {
    const memberObligations = obligations.filter((o) =>
      memberIdsMatch(member, o.member ?? o.user)
    );
    const memberTransactions = transactions
      .filter((t) => memberIdsMatch(member, t.member ?? t.user))
      .sort((a, b) => new Date(b.paidAt ?? b.createdAt ?? 0) - new Date(a.paidAt ?? a.createdAt ?? 0));

    const planIds = new Set(memberObligations.map((o) => o.paymentLink?.id ?? o.recurringPlan?.id));
    const paidCount = memberObligations.filter((o) => (o.status ?? "").toUpperCase() === "PAID").length;
    const totalCount = memberObligations.length;
    const failedCount = memberTransactions.filter((t) => (t.status ?? "").toUpperCase() === "FAILED").length;

    return {
      ...member,
      planCount: planIds.size,
      paidCount,
      totalCount,
      failedCount,
      lastPaymentDate: memberTransactions[0]?.paidAt ?? memberTransactions[0]?.createdAt ?? null,
      obligations: memberObligations,
      transactions: memberTransactions,
    };
  });

  return {
    members: enriched,
    obligations,
    transactions,
    isLoading: membersQuery.isLoading || obligationsQuery.isLoading || transactionsQuery.isLoading,
    error: membersQuery.error || obligationsQuery.error || transactionsQuery.error,
  };
}
