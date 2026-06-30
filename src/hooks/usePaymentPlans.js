import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityPaymentLinks,
  createPaymentLink,
  updatePaymentLink,
  activatePaymentLink,
  pausePaymentLink,
  resumePaymentLink,
  expirePaymentLink,
  archivePaymentLink,
  duplicatePaymentLink,
} from "../api/payments";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

// Shape a raw PaymentLink into what the dashboard/plans table renders.
// PaymentLink.metrics: { amountCollected, expectedAmount, currency,
//                         audienceSize, membersFullyPaid, membersPartiallyPaid, membersUnpaid }
function shapePlan(raw) {
  const m = raw.metrics ?? {};
  const expected = m.expectedAmount ?? 0;
  const collected = m.amountCollected ?? 0;
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.title ?? raw.name ?? "Untitled plan",
    description: raw.description,
    type: raw.paymentType, // "ONE_TIME" | "RECURRING"
    frequency: raw.recurringPlan?.frequency ?? raw.frequency,
    amount: raw.amount,
    status: raw.status,
    activateImmediately: raw.activateImmediately,
    amountCollected: collected,
    expectedAmount: expected,
    pct: expected > 0 ? Math.round((collected / expected) * 100) : 0,
    paidCount: m.membersFullyPaid ?? 0,
    partialCount: m.membersPartiallyPaid ?? 0,
    unpaidCount: m.membersUnpaid ?? 0,
    totalCount: m.audienceSize ?? 0,
    currency: m.currency ?? "NGN",
    dueAt: raw.dueAt ?? null,
  };
}

export function usePaymentPlans(communityId) {
  const queryClient = useQueryClient();
  const enabled = !!communityId;

  const query = useQuery({
    queryKey: ["community", communityId, "payment-links"],
    queryFn: async () => {
      const res = await getCommunityPaymentLinks(communityId);
      return unwrapList(res).map(shapePlan);
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "payment-links"] });
  }

  const create = useMutation({
    mutationFn: (payload) => createPaymentLink(communityId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan created" },
  });

  const update = useMutation({
    mutationFn: ({ paymentLinkId, payload }) => updatePaymentLink(communityId, paymentLinkId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan updated" },
  });

  const activate = useMutation({
    mutationFn: (paymentLinkId) => activatePaymentLink(communityId, paymentLinkId),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan activated" },
  });
  const pause = useMutation({
    mutationFn: (paymentLinkId) => pausePaymentLink(communityId, paymentLinkId),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan paused" },
  });
  const resume = useMutation({
    mutationFn: (paymentLinkId) => resumePaymentLink(communityId, paymentLinkId),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan resumed" },
  });
  const expire = useMutation({
    mutationFn: (paymentLinkId) => expirePaymentLink(communityId, paymentLinkId),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan expired" },
  });
  const archive = useMutation({
    mutationFn: (paymentLinkId) => archivePaymentLink(communityId, paymentLinkId),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan archived" },
  });
  const duplicate = useMutation({
    mutationFn: (paymentLinkId) => duplicatePaymentLink(communityId, paymentLinkId),
    onSuccess: invalidate,
    meta: { successMessage: "Payment plan duplicated" },
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create,
    update,
    activate,
    pause,
    resume,
    expire,
    archive,
    duplicate,
  };
}
