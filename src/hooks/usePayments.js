import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyObligations,
  getMyTransactions,
  getMyAuthorisations,
  deleteAuthorisation,
  initiatePayment,
  getMe,
  getMyCommunities,
  getMemberCommunityPaymentLinks,
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
    logo: raw.community?.logo,
  };
}

function shapePaymentLink(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: 0,
    name: raw.title ?? raw.name ?? "Payment",
    description: raw.title ?? raw.name ?? "Payment",
    communityName: raw.community?.name,
    dueDate: raw.dueAt ?? null,
    type: raw.paymentType === "RECURRING" || raw.recurringPlan ? "recurring" : "one-time",
    status: "PENDING",
    linkStatus: (raw.status ?? "").toUpperCase(),
    paymentLinkId: raw.id,
    obligationId: null,
    logoColor: "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
    logo: raw.community?.logo,
    _isLink: true,
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
    reference: raw.internalReference, // matches Topbar.jsx search results' field name
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

// /communities/me returns different shapes depending on role:
//   admin/owner → { name, slug, logo, owned: true, ... }
//   member      → { community: { name, slug, logo, ... }, memberRole, owned: false, ... }
// Normalize to always have name/slug/logo at the top level.
function normalizeCommunity(c) {
  if (!c) return null;
  return {
    ...c,
    name: c.name ?? c.community?.name,
    slug: c.slug ?? c.community?.slug,
    logo: c.logo ?? c.community?.logo,
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
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getMyTransactions();
      return unwrapList(res).map(shapeTransaction);
    },
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
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

  // Resolve the community slug — member records nest the community object
  // one level deep: { community: { slug } } instead of { slug } directly.
  const rawFirstCommunity = communitiesQuery.data?.[0] ?? null;
  const communitySlug =
    rawFirstCommunity?.slug ?? rawFirstCommunity?.community?.slug ?? null;

  // Fetch active payment plans for this community.  Using the community-scoped
  // URL (/communities/{slug}/payment-links) because the global /payment-links
  // endpoint may not be available; the admin uses the same URL and the backend
  // should honour member tokens for reads.
  const paymentLinksQuery = useQuery({
    queryKey: ["payment-links", communitySlug],
    queryFn: async () => {
      const res = await getMemberCommunityPaymentLinks(communitySlug);
      return unwrapList(res).map(shapePaymentLink);
    },
    enabled: !!communitySlug,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  const obligations = obligationsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const paymentLinks = paymentLinksQuery.data ?? [];

  // Sort obligations: overdue first, then by dueDate ascending
  const sorted = [...obligations].sort((a, b) => {
    const da = new Date(a.dueDate), db = new Date(b.dueDate);
    const sa = deriveStatus(a), sb = deriveStatus(b);
    if (sa === "overdue" && sb !== "overdue") return -1;
    if (sb === "overdue" && sa !== "overdue") return 1;
    return da - db;
  });

  const unpaidObligations = sorted.filter((o) => o.status !== "PAID");

  // Payment links that are ACTIVE and have no corresponding obligation yet
  // (covers plans created before the member joined, or backend timing gaps).
  const unmatchedLinks = paymentLinks.filter(
    (link) =>
      link.linkStatus === "ACTIVE" &&
      !obligations.some((o) => o.paymentLinkId === link.id)
  );

  const upcoming = [...unpaidObligations, ...unmatchedLinks];

  // nextDue = first item (obligations take priority via sort order above)
  const nextDue = upcoming[0] ?? null;

  return {
    data: {
      nextDue,
      upcoming,
      history: transactions,
      user: userQuery.data,
      community: normalizeCommunity(communitiesQuery.data?.[0]),
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
