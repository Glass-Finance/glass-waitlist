import { useQuery } from "@tanstack/react-query";
import { getCommunityMembers } from "../api/communities";
import { getCommunityObligations, getCommunityTransactions } from "../api/transactions";
import { getCommunityPaymentLinks } from "../api/payments";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

function memberIdsMatch(member, ref) {
  if (!ref) return false;
  const refId = ref.id ?? ref;
  const mUid = member.user?.id;
  const rUid = ref.user?.id;
  return (
    member.id === refId ||
    (mUid != null && mUid === refId) ||
    // Only match by user-id pair when both sides actually have one —
    // undefined === undefined would silently match every member
    (mUid != null && rUid != null && mUid === rUid)
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

  // Obligations are generated for a member on a delay (next billing cycle,
  // a scheduled job, etc.), so a just-added member can have zero obligation
  // records for days even though they're enrolled in an active plan --
  // without this, the Members table shows "no plan" for every fresh account.
  // Mirrors the same gap-covering fallback usePayments.js already applies
  // on the member's own Home/Upcoming screens.
  const paymentLinksQuery = useQuery({
    queryKey: ["community", communityId, "payment-links"],
    queryFn: async () => unwrapList(await getCommunityPaymentLinks(communityId)),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const members = membersQuery.data ?? [];
  const obligations = obligationsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const activePlanIds = (paymentLinksQuery.data ?? [])
    .filter((p) => (p.status ?? "").toUpperCase() === "ACTIVE")
    .map((p) => p.id);

  const enriched = members.map((member) => {
    const memberObligations = obligations.filter((o) =>
      memberIdsMatch(member, o.member ?? o.user)
    );
    const memberTransactions = transactions
      .filter((t) => memberIdsMatch(member, t.member ?? t.user))
      .sort((a, b) => new Date(b.paidAt ?? b.createdAt ?? 0) - new Date(a.paidAt ?? a.createdAt ?? 0));

    const planIds = new Set(memberObligations.map((o) => o.paymentLink?.id ?? o.recurringPlan?.id));

    // Set of obligation IDs that have a successful transaction (backend may not
    // update obligation.status to PAID immediately after payment verification)
    const successStatuses = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);
    const successfulTxs = memberTransactions.filter((t) =>
      successStatuses.has((t.status ?? "").toUpperCase())
    );
    // Fallback 1: obligation ID on transaction (works when backend sets it)
    const paidObligationIds = new Set(successfulTxs.map((t) => t.obligationId).filter(Boolean));
    // Fallback 2: payment link ID match (covers payment-link flow where obligationId is null)
    const paidLinkIds = new Set(successfulTxs.map((t) => t.paymentLink?.id).filter(Boolean));

    const paidCount = memberObligations.filter((o) => {
      const s = (o.status ?? "").toUpperCase();
      if (s === "PAID" || s === "SUCCESSFUL") return true;
      if (paidObligationIds.has(o.id)) return true;
      return !!o.paymentLink?.id && paidLinkIds.has(o.paymentLink.id);
    }).length;

    const failedCount = memberTransactions.filter((t) => (t.status ?? "").toUpperCase() === "FAILED").length;

    // Exempt members genuinely have no dues -- only fill the gap for
    // everyone else, and only for plans that don't already have a real
    // obligation counted above (avoids double-counting).
    if (!member.billingExempt) {
      for (const planId of activePlanIds) {
        if (!planIds.has(planId)) planIds.add(planId);
      }
    }
    const totalCount = Math.max(memberObligations.length, planIds.size);

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
    isLoading:
      membersQuery.isLoading ||
      obligationsQuery.isLoading ||
      transactionsQuery.isLoading ||
      paymentLinksQuery.isLoading,
    // Gated on "no data at all", not just "error is set" -- same fix as
    // usePayments.js's Home/Upcoming flicker: React Query keeps a query's
    // last-good data around through a failed background refetch, it
    // doesn't clear it. Surfacing the error unconditionally meant a single
    // transient failure (even after the automatic retry) could blank out
    // an already-successfully-loaded members table.
    error:
      (membersQuery.error && !membersQuery.data) ||
      (obligationsQuery.error && !obligationsQuery.data) ||
      (transactionsQuery.error && !transactionsQuery.data) ||
      (paymentLinksQuery.error && !paymentLinksQuery.data) ||
      null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// The payment links that actually target one specific member — audience-aware
// (ALL_MEMBERS, their group, or explicit selection), via the backend's
// memberId filter on GET .../payment-links. Used on MemberDetail.jsx instead
// of the blanket "every active community plan applies to every member"
// fallback above, which doesn't account for group/selected-member audiences,
// and doesn't need to wait on the obligation-generation delay noted there.
export function useMemberPaymentLinks(communityId, memberId) {
  const enabled = !!communityId && !!memberId;
  const query = useQuery({
    queryKey: ["community", communityId, "payment-links", "member", memberId],
    queryFn: async () => unwrapList(await getCommunityPaymentLinks(communityId, { memberId })),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
  return {
    paymentLinks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
