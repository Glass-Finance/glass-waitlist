import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyObligations,
  getMyTransactions,
  getMyAuthorisations,
  deleteAuthorisation,
  initiatePayment,
  getMe,
  getMyCommunities,
  getPaymentLinks,
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
    communitySlug: raw.community?.slug,
    dueDate: raw.dueAt,
    type: raw.recurringPlan ? "recurring" : "one-time",
    status: (() => { const s = (raw.status ?? "PENDING").toUpperCase(); return s === "SUCCESSFUL" ? "PAID" : s; })(),
    paymentLinkId: raw.paymentLink?.id,
    obligationId: raw.id,
    logoColor: "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
    logo: raw.community?.logo,
  };
}

function shapePaymentLink(raw, fallbackCommunitySlug) {
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: 0,
    name: raw.title ?? raw.name ?? "Payment",
    description: raw.title ?? raw.name ?? "Payment",
    communityName: raw.community?.name,
    communitySlug: raw.community?.slug ?? fallbackCommunitySlug,
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
    communitySlug: raw.community?.slug,
    date: raw.paidAt ?? raw.createdAt,
    status: (raw.status ?? "").toLowerCase(), // "success" | "failed" | "pending" | "initiated"
    channel: raw.channel,
    currency: raw.currency ?? "NGN",
    reference: raw.internalReference,
    paymentLinkId: raw.paymentLink?.id,
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
  const queryClient = useQueryClient();

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

  // refetchOnMount: "always" matters here specifically -- accepting an
  // invite invalidates this query, but Home isn't mounted yet at that
  // moment (still on the Invites screen), so there's no active observer
  // for invalidateQueries to force-refetch. Without this, landing on Home
  // right after accepting can render with the pre-accept communities list,
  // which silently breaks the community/payment-links resolution below for
  // a member who just joined.
  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await getMyCommunities();
      return unwrapList(res);
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });

  // Active community: prefer whatever the member last selected in MyCommunities,
  // falling back to the first community returned by the API.
  const storedCommunity = (() => {
    try { return JSON.parse(localStorage.getItem("glass_member_community") ?? "null"); }
    catch { return null; }
  })();

  const rawCommunities = communitiesQuery.data ?? [];

  // Match stored slug/id against the fetched list so we get the full object.
  const rawActiveCommunity = storedCommunity
    ? (rawCommunities.find((c) =>
        (c.slug ?? c.community?.slug) === storedCommunity.slug ||
        (c.id   ?? c.community?.id)   === storedCommunity.id
      ) ?? rawCommunities[0])
    : rawCommunities[0];

  const communitySlug =
    rawActiveCommunity?.slug ?? rawActiveCommunity?.community?.slug ?? null;
  // Use id as fallback identifier when no slug exists
  const communityIdentifier =
    communitySlug ??
    rawActiveCommunity?.id ??
    rawActiveCommunity?.community?.id ??
    null;

  // GET /payment-links is the member-accessible endpoint (visibility-gated).
  // Filter by communityIdentifier so members only see their active community's links.
  const paymentLinksQuery = useQuery({
    queryKey: ["payment-links", communityIdentifier],
    queryFn: async () => {
      const res = await getPaymentLinks(
        communityIdentifier ? { communityIdentifier, status: "ACTIVE" } : { status: "ACTIVE" }
      );
      return unwrapList(res).map((raw) => shapePaymentLink(raw, communitySlug ?? communityIdentifier));
    },
    enabled: !!communityIdentifier,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  const allObligations = obligationsQuery.data ?? [];
  const allTransactions = transactionsQuery.data ?? [];
  const paymentLinks = paymentLinksQuery.data ?? [];

  // Scope to the active community when one is known
  const obligations = communitySlug
    ? allObligations.filter((o) => !o.communitySlug || o.communitySlug === communitySlug)
    : allObligations;
  const transactions = communitySlug
    ? allTransactions.filter((t) => !t.communitySlug || t.communitySlug === communitySlug)
    : allTransactions;

  // Sort obligations: overdue first, then by dueDate ascending
  const sorted = [...obligations].sort((a, b) => {
    const da = new Date(a.dueDate), db = new Date(b.dueDate);
    const sa = deriveStatus(a), sb = deriveStatus(b);
    if (sa === "overdue" && sb !== "overdue") return -1;
    if (sb === "overdue" && sa !== "overdue") return 1;
    return da - db;
  });

  const unpaidObligations = sorted.filter((o) => o.status !== "PAID");

  // Payment links that are ACTIVE (or have no status set) and have no
  // corresponding obligation yet (covers plans created before the member
  // joined, or backend timing gaps).
  const unmatchedLinks = paymentLinks.filter((link) => {
  const isActive = link.linkStatus === "ACTIVE" || !link.linkStatus;
  if (!isActive) return false;
  if (obligations.some((o) => o.paymentLinkId === link.id)) return false;
  // No obligation record doesn't necessarily mean unpaid — a one-time link
  // can already have a successful transaction with no obligation ever
  // created for it. Recurring links are excluded from this check since a
  // past successful cycle shouldn't hide the next one's due payment.
  if (link.type === "one-time") {
    const alreadyPaid = allTransactions.some(
      (t) => t.paymentLinkId === link.id && t.status === "successful"
    );
    if (alreadyPaid) return false;
  }
  return true;
});

  // Enrich items: if the obligation/link response didn't carry community logo
  // back (not always populated by the backend), fall back to the logo we got
  // from the communities list — which always returns it.
  const activeLogo = normalizeCommunity(rawActiveCommunity)?.logo ?? null;
  const enrichLogo = (item) =>
    item.logo?.url ? item : { ...item, logo: activeLogo };

  const upcoming = [...unpaidObligations, ...unmatchedLinks].map(enrichLogo);

  // nextDue = first item (obligations take priority via sort order above)
  const nextDue = upcoming[0] ?? null;

  return {
    data: {
      nextDue,
      upcoming,
      history: transactions,
      user: userQuery.data,
      community: normalizeCommunity(rawActiveCommunity),
    },
    isLoading:
      obligationsQuery.isLoading ||
      transactionsQuery.isLoading ||
      userQuery.isLoading,
    // communitiesQuery failing is genuinely blocking (no community context
    // at all to render). paymentLinksQuery failing is NOT -- it's a known,
    // permanent 403 for regular members (see comment above), and a
    // member's real obligations should still render normally regardless,
    // so its failure is deliberately excluded here rather than blocking
    // the whole page with a "try again" that can never succeed.
    error:
      obligationsQuery.error ||
      transactionsQuery.error ||
      userQuery.error ||
      communitiesQuery.error ||
      null,
    // For a manual "Check again" affordance -- refetches everything this
    // hook depends on, not just whichever query happens to be visible.
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payment-links"] });
    },
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
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
