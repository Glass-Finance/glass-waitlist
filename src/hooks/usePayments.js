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
    (new Date(obligation.dueDate) - new Date()) / 86400000,
  );
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}

// For a recurring plan with no obligation record yet (common right after a
// payment — the next cycle's obligation isn't generated immediately), this
// checks whether the member already has a successful transaction for this
// link within the *current* billing cycle, so a just-paid recurring plan
// doesn't reappear as "upcoming" until the next cycle actually begins.
// Approximates the cycle as the current calendar week (WEEKLY) or calendar
// month (MONTHLY/others) — matches the plan's own billingDay semantics
// closely enough without needing to replicate the backend's exact cycle
// math client-side.
function isPaidForCurrentCycle(link, transactions) {
  const lastSuccess = transactions
    .filter((t) => t.paymentLinkId === link.id && t.status === "success")
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!lastSuccess?.date) return false;

  const paidDate = new Date(lastSuccess.date);
  const now = new Date();
  const frequency = (link.frequency ?? "MONTHLY").toUpperCase();

  if (frequency === "WEEKLY") {
    return now - paidDate < 7 * 86400000;
  }
  // MONTHLY (and any other/unknown frequency) — same calendar month
  return (
    paidDate.getFullYear() === now.getFullYear() &&
    paidDate.getMonth() === now.getMonth()
  );
}

// Shape the raw obligation response into what the UI expects
function shapeObligation(raw) {
  const plType = (
    raw.paymentLink?.paymentType ??
    raw.paymentLink?.type ??
    ""
  ).toUpperCase();
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: raw.amountPaid ?? 0,
    name: raw.paymentLink?.title ?? raw.description ?? "Payment",
    description: raw.paymentLink?.title ?? raw.description ?? "Payment",
    communityName: raw.community?.name,
    communitySlug: raw.community?.slug,
    dueDate: raw.dueAt,
    // recurringPlan field + paymentType on the link both indicate a recurring plan
    type:
      raw.recurringPlan || plType === "RECURRING" ? "recurring" : "one-time",
    frequency:
      raw.paymentLink?.frequency ?? raw.paymentLink?.billingFrequency ?? null,
    status: (() => {
      const s = (raw.status ?? "PENDING").toUpperCase();
      return s === "SUCCESSFUL" ? "PAID" : s;
    })(),
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
    type:
      raw.paymentType === "RECURRING" || raw.recurringPlan
        ? "recurring"
        : "one-time",
    frequency:
      raw.recurringPlan?.frequency ??
      raw.frequency ??
      raw.billingFrequency ??
      null,
    billingDay: raw.recurringPlan?.billingDay ?? raw.billingDay ?? null,
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
    expMonth: raw.expMonth ?? raw.exp_month ?? null,
    expYear: raw.expYear ?? raw.exp_year ?? null,
    cardType: raw.cardType ?? raw.brand ?? raw.channel ?? null,
    channel: raw.channel,
    reusable: raw.reusable,
    status: raw.status,
    consents: (raw.consents ?? []).map((c) => ({
      id: c.consentId,
      planStatus: c.planStatus,
      communityName: c.community?.name,
      paymentLinkTitle: c.paymentLink?.title,
      paymentLinkId: c.paymentLink?.id ?? null,
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
      try {
        const res = await getMyObligations();
        return unwrapList(res).map(shapeObligation);
      } catch (err) {
        // 404 means the member has no obligations yet — that's a valid empty
        // state, not a real error. Don't block the page for it.
        if (err?.response?.status === 404) return [];
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        const res = await getMyTransactions();
        return unwrapList(res).map(shapeTransaction);
      } catch (err) {
        if (err?.response?.status === 404) return [];
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
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
    try {
      return JSON.parse(
        localStorage.getItem("glass_member_community") ?? "null",
      );
    } catch {
      return null;
    }
  })();

  const rawCommunities = communitiesQuery.data ?? [];

  // Only ACTIVE memberships grant real access. PENDING means a join request
  // was submitted but the admin hasn't approved it yet — the community
  // shouldn't unlock dashboard/payment access until memberStatus flips.
  const activeCommunities = rawCommunities.filter(
    (c) => (c.memberStatus ?? "ACTIVE").toUpperCase() === "ACTIVE",
  );
  const pendingCommunities = rawCommunities.filter(
    (c) => (c.memberStatus ?? "").toUpperCase() === "PENDING",
  );

  // Match stored slug/id against the fetched list so we get the full object.
  const rawActiveCommunity = storedCommunity
    ? (activeCommunities.find(
        (c) =>
          (c.slug ?? c.community?.slug) === storedCommunity.slug ||
          (c.id ?? c.community?.id) === storedCommunity.id,
      ) ?? activeCommunities[0])
    : activeCommunities[0];

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
        communityIdentifier
          ? { communityIdentifier, status: "ACTIVE" }
          : { status: "ACTIVE" },
      );
      return unwrapList(res).map((raw) =>
        shapePaymentLink(raw, communitySlug ?? communityIdentifier),
      );
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
    ? allObligations.filter(
        (o) => !o.communitySlug || o.communitySlug === communitySlug,
      )
    : allObligations;
  const transactions = communitySlug
    ? allTransactions.filter(
        (t) => !t.communitySlug || t.communitySlug === communitySlug,
      )
    : allTransactions;

  // Sort obligations: overdue first, then by dueDate ascending
  const sorted = [...obligations].sort((a, b) => {
    const da = new Date(a.dueDate),
      db = new Date(b.dueDate);
    const sa = deriveStatus(a),
      sb = deriveStatus(b);
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
    // No obligation record doesn't necessarily mean unpaid.
    if (link.type === "one-time") {
      // A one-time link can already have a successful transaction with no
      // obligation ever created for it.
      const alreadyPaid = allTransactions.some(
        (t) => t.paymentLinkId === link.id && t.status === "success",
      );
      if (alreadyPaid) return false;
    } else {
      // Recurring: a past cycle's payment shouldn't hide a *future* cycle's
      // due payment, but it should hide the *current* one — otherwise a
      // member who just paid sees the same plan reappear as due again
      // immediately, before the next cycle has even started.
      if (isPaidForCurrentCycle(link, allTransactions)) return false;
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
      userQuery.isLoading ||
      communitiesQuery.isLoading,
    hasNoCommunity:
      !communitiesQuery.isLoading && activeCommunities.length === 0,
    hasPendingCommunity:
      !communitiesQuery.isLoading &&
      activeCommunities.length === 0 &&
      pendingCommunities.length > 0,
    pendingCommunity: pendingCommunities[0]
      ? normalizeCommunity(pendingCommunities[0])
      : null,
    // Only obligations + communities are truly blocking for the Upcoming
    // Payments view. Transactions and user-profile failures are secondary:
    // missing transactions means the "already paid" filter is conservative,
    // and missing user data is only used for display. Neither warrants an
    // error wall that prevents members from seeing their obligations.
    error: obligationsQuery.error || communitiesQuery.error || null,
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
