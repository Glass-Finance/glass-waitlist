import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyObligations,
  getMyTransactions,
  getMyAuthorisations,
  deleteAuthorisation,
  initiatePayment,
  verifyPayment,
  getMe,
  getMyCommunities,
} from "../api/members";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function deriveStatus(obligation) {
  const days = Math.ceil(
    (new Date(obligation.dueDate) - new Date()) / 86400000
  );
  if (obligation.status === "paid") return "paid";
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}

// Shape the raw obligation response into what the UI expects
function shapeObligation(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    description: raw.name ?? raw.description,
    communityName: raw.community?.name ?? raw.communityName,
    dueDate: raw.dueDate ?? raw.due_date,
    type: raw.frequency === "one_time" ? "one-time" : "recurring",
    status: raw.status,
    paymentLinkId: raw.paymentLinkId ?? raw.payment_link_id,
    logoColor: raw.community?.color ?? "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
  };
}

function shapeTransaction(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    description: raw.description ?? raw.name,
    communityName: raw.community?.name,
    date: raw.createdAt ?? raw.created_at,
    status: raw.status, // "success" | "failed" | "pending"
    reference: raw.reference,
  };
}

function shapeAuthorisation(raw) {
  return {
    id: raw.id,
    type: raw.type ?? "recurring",
    amount: raw.amount,
    name: raw.name ?? raw.description,
    nextCharge: raw.nextChargeDate ?? raw.next_charge_date,
    autoPay: raw.isActive ?? true,
    logo: raw.community?.logo ?? null,
    card: {
      last4: raw.card?.last4 ?? raw.last4 ?? "****",
      expiry: raw.card?.expiry ?? raw.expiry ?? "**/**",
      brand: raw.card?.brand ?? "mastercard",
    },
    obligationId: raw.obligationId,
    paymentLinkId: raw.paymentLinkId,
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
      return (res.data?.data ?? []).map(shapeObligation);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getMyTransactions();
      return (res.data?.data ?? []).map(shapeTransaction);
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
      return res.data?.data ?? [];
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
  const nextDue = sorted.find((o) => o.status !== "paid") ?? null;

  // upcoming = all obligations (includes overdue for display)
  const upcoming = sorted.filter((o) => o.status !== "paid");

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
// Manage Payments hook — authorisations (saved cards + auto-pay)
// ─────────────────────────────────────────────────────────────────────────────
export function useManagePayments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["authorisations"],
    queryFn: async () => {
      const res = await getMyAuthorisations();
      return (res.data?.data ?? []).map(shapeAuthorisation);
    },
    staleTime: 1000 * 60 * 2,
  });

  // Disable auto-pay by deleting the authorisation
  const disableAutoPay = useMutation({
    mutationFn: (authId) => deleteAuthorisation(authId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorisations"] });
    },
  });

  // Optimistically toggle autoPay in local cache
  function toggleAutoPay(id, enabled) {
    if (!enabled) {
      disableAutoPay.mutate(id);
    } else {
      // Re-enabling auto-pay would require creating a new authorisation
      // which happens via the payment flow — flag for now
      console.warn("Re-enabling auto-pay must be done through a new payment");
    }
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    toggleAutoPay,
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

// ─────────────────────────────────────────────────────────────────────────────
// Verify payment after Paystack callback
// ─────────────────────────────────────────────────────────────────────────────
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => verifyPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["authorisations"] });
    },
  });
}
