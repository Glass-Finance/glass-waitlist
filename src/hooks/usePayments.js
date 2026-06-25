import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyObligations,
  getMyTransactions,
  getMyAuthorisations,
  deleteAuthorisation,
  initiatePayment,
  getMe,
  getMyCommunities,
} from "../api/members";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Backend list endpoints return a paginated envelope: { content, pageNumber, ... }
// Some return a bare array. Handle both.
function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

function deriveStatus(obligation) {
  if (obligation.status === "PAID") return "paid";
  const days = Math.ceil(
    (new Date(obligation.dueDate) - new Date()) / 86400000
  );
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}

// Shape the raw obligation response into what the UI expects
function shapeObligation(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: raw.amountPaid ?? 0,
    name: raw.paymentLink?.title ?? raw.description ?? "Payment",
    description: raw.paymentLink?.title ?? raw.description ?? "Payment",
    communityName: raw.community?.name,
    dueDate: raw.dueAt,
    type: raw.recurringPlan ? "recurring" : "one-time",
    status: (raw.status ?? "PENDING").toUpperCase(),
    paymentLinkId: raw.paymentLink?.id,
    obligationId: raw.id,
    logoColor: "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
  };
}

function shapeTransaction(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: raw.amountPaid,
    description: raw.description ?? raw.paymentLink?.title ?? "Payment",
    communityName: raw.community?.name,
    date: raw.paidAt ?? raw.createdAt,
    status: (raw.status ?? "").toLowerCase(), // "success" | "failed" | "pending" | "initiated"
    channel: raw.channel,
    currency: raw.currency ?? "NGN",
  };
}

function shapeAuthorisation(raw) {
  return {
    id: raw.id,
    bank: raw.bank,
    bankCode: raw.bankCode,
    last4: raw.last4 ?? "****",
    channel: raw.channel,
    reusable: raw.reusable,
    status: raw.status,
    consents: (raw.consents ?? []).map((c) => ({
      // The consent object's id field is `consentId`, not `id` — using the
      // wrong key meant every consent rendered with key={undefined} in
      // ManagePayments, which silently breaks React's identity tracking
      // for any authorisation with more than one active consent.
      id: c.consentId,
      planStatus: c.planStatus,
      communityName: c.community?.name,
      paymentLinkTitle: c.paymentLink?.title,
      revoked: !!c.revokedAt,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main hook — Home screen data
// Returns: { nextDue, upcoming[], user, community, isLoading, error }
// ─────────────────────────────────────────────────────────────────────────────
export function usePayments() {
  const obligationsQuery = useQuery({
    queryKey: ["obligations"],
    queryFn: async () => {
      const res = await getMyObligations();
      return unwrapList(res).map(shapeObligation);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getMyTransactions();
      return unwrapList(res).map(shapeTransaction);
    },
    staleTime: 1000 * 60 * 2,
  });

  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await getMe();
      return res.data?.data ?? res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await getMyCommunities();
      return unwrapList(res);
    },
    staleTime: 1000 * 60 * 5,
  });

  const obligations = obligationsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  // Sort obligations: overdue first, then by dueDate ascending
  const sorted = [...obligations].sort((a, b) => {
    const da = new Date(a.dueDate), db = new Date(b.dueDate);
    const sa = deriveStatus(a), sb = deriveStatus(b);
    if (sa === "overdue" && sb !== "overdue") return -1;
    if (sb === "overdue" && sa !== "overdue") return 1;
    return da - db;
  });

  // nextDue = first unpaid/overdue obligation
  const nextDue = sorted.find((o) => o.status !== "PAID") ?? null;

  // upcoming = all unpaid obligations (includes overdue for display)
  const upcoming = sorted.filter((o) => o.status !== "PAID");

  return {
    data: {
      nextDue,
      upcoming,
      history: transactions,
      user: userQuery.data,
      community: communitiesQuery.data?.[0] ?? null,
    },
    isLoading:
      obligationsQuery.isLoading ||
      transactionsQuery.isLoading ||
      userQuery.isLoading,
    error:
      obligationsQuery.error ||
      transactionsQuery.error ||
      userQuery.error ||
      null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manage Payments hook — saved payment authorisations (bank/channel + consents)
// ─────────────────────────────────────────────────────────────────────────────
export function useManagePayments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["authorisations"],
    queryFn: async () => {
      const res = await getMyAuthorisations();
      return unwrapList(res).map(shapeAuthorisation);
    },
    staleTime: 1000 * 60 * 2,
  });

  // Disable auto-pay by removing the authorisation entirely
  const disableAutoPay = useMutation({
    mutationFn: (authId) => deleteAuthorisation(authId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorisations"] });
    },
  });

  // Re-enabling isn't supported by the API — auto-pay is re-established only
  // by completing a new payment with a fresh authorisation.
  function toggleAutoPay(id, enabled) {
    if (!enabled) disableAutoPay.mutate(id);
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    toggleAutoPay,
    isRemoving: disableAutoPay.isPending,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Initiate payment mutation
// ─────────────────────────────────────────────────────────────────────────────
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentLinkId, payload }) =>
      initiatePayment(paymentLinkId, payload),
    onSuccess: () => {
      // Refresh obligations and transactions after successful payment
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
