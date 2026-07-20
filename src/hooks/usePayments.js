import { useEffect } from "react";
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
  getPaymentLinks,
} from "../api/members";
import { toastSuccess } from "../utils/toast";

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

// ─── Local paid log ───────────────────────────────────────────────────────────
// Transactions are the source of truth for "already paid", but the endpoint
// can lag behind a fresh payment or omit the paymentLink on new records — in
// which case the paid checks below can't match and the due keeps showing as
// unpaid. Every successful payment witnessed client-side is recorded here as
// a safety net, so the payer's own screen reflects Paid immediately.
const PAID_LOG_KEY = "glass_local_paid_log";

function readPaidLog() {
  try {
    return JSON.parse(localStorage.getItem(PAID_LOG_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function recordLocalPayment({ paymentLinkId, obligationId }) {
  if (!paymentLinkId && !obligationId) return;
  try {
    const log = readPaidLog();
    log.push({
      paymentLinkId: paymentLinkId ?? null,
      obligationId: obligationId ?? null,
      paidAt: new Date().toISOString(),
    });
    localStorage.setItem(PAID_LOG_KEY, JSON.stringify(log.slice(-50)));
  } catch {
    /* ignore */
  }
}

function lastLocalPaidAt({ paymentLinkId, obligationId }) {
  const hit = readPaidLog()
    .filter(
      (e) =>
        (paymentLinkId && e.paymentLinkId === paymentLinkId) ||
        (obligationId && e.obligationId === obligationId),
    )
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0];
  return hit ? new Date(hit.paidAt) : null;
}

// The payment context is stashed before redirecting to Paystack so whichever
// page confirms the payment afterwards (callback page, or the pending-ref
// check on Home) can write the paid log for the right plan.
const PENDING_CTX_KEY = "paymentPendingCtx";

export function stashPendingPaymentCtx(ctx) {
  try {
    sessionStorage.setItem(PENDING_CTX_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

// ─── Local fee cache ────────────────────────────────────────────────────────
// The transaction fee is known and already shown to the payer at checkout
// (PaymentSummary.jsx's "Platform Fee" = billedAmount - amount), but the
// completed transaction record fetched afterwards (getTransaction/
// getCommunityTransaction) often comes back with no fee field populated at
// all -- the receipt then has no way to show a real number, only "—". Since
// the fee is deterministic and already known the moment payment is
// initiated, it's cached here under every identifier the transaction could
// later be looked up by (Paystack's own reference, and the real internal
// transactionId once verifyPayment's response reveals it) so
// useTransactionDetail can fall back to it instead of losing the number
// entirely.
const FEE_LOG_KEY = "glass_local_fee_log";

function readFeeLog() {
  try {
    return JSON.parse(localStorage.getItem(FEE_LOG_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function recordLocalFee(key, feeMinor) {
  if (!key || feeMinor == null) return;
  try {
    const log = readFeeLog();
    log[key] = feeMinor;
    const keys = Object.keys(log);
    if (keys.length > 100) {
      for (const k of keys.slice(0, keys.length - 100)) delete log[k];
    }
    localStorage.setItem(FEE_LOG_KEY, JSON.stringify(log));
  } catch {
    /* ignore */
  }
}

export function lookupLocalFee(key) {
  if (!key) return null;
  const value = readFeeLog()[key];
  return value ?? null;
}

// transactionId is optional -- known once verifyPayment's response reveals
// it (a beat after settlement), so the fee gets cached under whichever
// identifiers are available at the time this runs.
export function settleLocalPaymentForReference(reference, transactionId) {
  try {
    const raw = sessionStorage.getItem(PENDING_CTX_KEY);
    if (!raw) return;
    const ctx = JSON.parse(raw);
    if (!reference || !ctx.reference || ctx.reference === reference) {
      recordLocalPayment(ctx);
      if (ctx.feeMinor != null) {
        recordLocalFee(ctx.reference, ctx.feeMinor);
        if (transactionId) recordLocalFee(transactionId, ctx.feeMinor);
      }
      sessionStorage.removeItem(PENDING_CTX_KEY);
    }
  } catch {
    /* ignore */
  }
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
export function isPaidForCurrentCycle(link, transactions, { obligationId } = {}) {
  const lastSuccess = transactions
    .filter((t) => t.paymentLinkId === link.id && t.status === "success")
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const localPaidAt = lastLocalPaidAt({ paymentLinkId: link.id, obligationId });
  const paidDate = [lastSuccess?.date, localPaidAt]
    .filter(Boolean)
    .map((d) => new Date(d))
    .sort((a, b) => b - a)[0];
  if (!paidDate) return false;

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

// An obligation the backend still reports unpaid can already be settled:
// payment verification writes status back asynchronously, and a recurring
// plan's obligation can stay PENDING until the next cycle's record is
// generated. Without this check, a member who just paid keeps seeing (and
// can keep re-paying) the same due. Treat the obligation as settled when a
// successful transaction exists for the same payment link — any time for
// one-time plans, within the current billing cycle for recurring ones.
export function isObligationSettled(o, transactions) {
  const obligationId = o.obligationId ?? o.id;
  if (!o.paymentLinkId && !obligationId) return false;
  // Exact match first: a successful transaction carrying this obligation's
  // own id settles it definitively, regardless of plan type or the cycle
  // approximations below (which can miss right at a cycle boundary).
  if (
    obligationId &&
    transactions.some(
      (t) =>
        t.status === "success" &&
        t.obligationId &&
        String(t.obligationId) === String(obligationId),
    )
  ) {
    return true;
  }
  if (o.type === "one-time") {
    return (
      transactions.some(
        (t) => t.paymentLinkId === o.paymentLinkId && t.status === "success",
      ) || !!lastLocalPaidAt({ paymentLinkId: o.paymentLinkId, obligationId })
    );
  }
  return isPaidForCurrentCycle(
    { id: o.paymentLinkId, frequency: o.frequency },
    transactions,
    { obligationId },
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
    // Whether the plan this obligation belongs to is still ACTIVE -- an
    // obligation generated before a plan was paused/archived/expired can
    // outlive that change (the backend doesn't retroactively cancel it),
    // so without this a duplicated-then-deactivated plan's stale unpaid
    // obligation keeps showing as due indefinitely even though the plan
    // itself no longer accepts payments.
    linkStatus: (raw.paymentLink?.status ?? "").toUpperCase(),
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
    // The backend's enum is SUCCESSFUL — normalise to "success" here so the
    // paid checks in this file (and everywhere else consuming shaped
    // transactions) match on a single value.
    status: (() => {
      const s = (raw.status ?? "").toLowerCase();
      return s === "successful" ? "success" : s;
    })(),
    channel: raw.channel,
    currency: raw.currency ?? "NGN",
    reference: raw.internalReference,
    paymentLinkId: raw.paymentLink?.id,
    obligationId: raw.obligationId,
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
// Global overview — cross-community rollup for the home dashboard.
// Unlike usePayments (which scopes to one active community), this returns the
// user's unpaid obligations and recent transactions across ALL communities.
// Shares the ["obligations"]/["transactions"] cache keys with usePayments so
// neither hook triggers duplicate fetches.
// ─────────────────────────────────────────────────────────────────────────────
export function useGlobalOverview() {
  const obligationsQuery = useQuery({
    queryKey: ["obligations"],
    queryFn: async () => {
      try {
        const res = await getMyObligations();
        return unwrapList(res).map(shapeObligation);
      } catch (err) {
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

  const upcoming = [...(obligationsQuery.data ?? [])]
    .filter((o) => {
      const linkIsActive = o.linkStatus === "ACTIVE" || !o.linkStatus;
      return linkIsActive && o.status !== "PAID" && !isObligationSettled(o, transactionsQuery.data ?? []);
    })
    .sort((a, b) => {
      const sa = deriveStatus(a);
      const sb = deriveStatus(b);
      if (sa === "overdue" && sb !== "overdue") return -1;
      if (sb === "overdue" && sa !== "overdue") return 1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  const recentActivity = [...(transactionsQuery.data ?? [])].sort(
    (a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0),
  );

  return {
    upcoming,
    recentActivity,
    isLoading: obligationsQuery.isLoading || transactionsQuery.isLoading,
    error: obligationsQuery.error ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main hook — Home screen data
// Returns: { nextDue, upcoming[], user, community, isLoading, error }
//
// preferredCommunityIdentifier (optional): pins the "active community" this
// hook scopes to, overriding the glass_member_community localStorage guess
// below. Needed by AdminDashboard.jsx -- an owner who belongs to more than
// one community as a paying member has their own single "last selected"
// member community in localStorage, which has no relationship to whichever
// community's admin dashboard they currently have open. Without this, "Your
// Payments" on the admin dashboard silently showed a *different* community's
// dues (or none at all) instead of the one actually on screen.
// ─────────────────────────────────────────────────────────────────────────────
export function usePayments(preferredCommunityIdentifier) {
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

  function findByIdentifier(identifier) {
    if (!identifier) return null;
    return activeCommunities.find(
      (c) =>
        (c.slug ?? c.community?.slug) === identifier ||
        (c.id ?? c.community?.id) === identifier,
    );
  }

  // Explicit caller override wins, then whatever the member last selected in
  // MyCommunities, falling back to the first community returned by the API.
  const rawActiveCommunity =
    findByIdentifier(preferredCommunityIdentifier) ??
    (storedCommunity
      ? (findByIdentifier(storedCommunity.slug ?? storedCommunity.id) ?? activeCommunities[0])
      : activeCommunities[0]);

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

  const unpaidObligations = sorted.filter((o) => {
    const linkIsActive = o.linkStatus === "ACTIVE" || !o.linkStatus;
    return linkIsActive && o.status !== "PAID" && !isObligationSettled(o, allTransactions);
  });

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
      const alreadyPaid =
        allTransactions.some(
          (t) => t.paymentLinkId === link.id && t.status === "success",
        ) || !!lastLocalPaidAt({ paymentLinkId: link.id });
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
    // paymentLinksQuery matters here: it only starts fetching once
    // communityIdentifier is known (a beat after communitiesQuery resolves),
    // and unmatchedLinks -- links with no obligation record yet -- can be
    // the *only* source of nextDue for a plan the backend hasn't generated
    // an obligation for. Without gating on it too, the page could pass
    // isLoading=false on the very first render (the other four queries
    // already resolved) while paymentLinksQuery was still on its first
    // fetch, rendering "No Payments Due" for a moment before the real due
    // amount popped in a beat later -- a real flash, not a flaky network.
    isLoading:
      obligationsQuery.isLoading ||
      transactionsQuery.isLoading ||
      userQuery.isLoading ||
      communitiesQuery.isLoading ||
      paymentLinksQuery.isLoading,
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
    //
    // Gated on "no data at all" (not just "error is set"): on a flaky mobile
    // connection a background refetch can fail even though we already have
    // good cached data sitting in the query -- React Query keeps that data
    // around through a failed refetch, it doesn't clear it. Surfacing the
    // error in that case flashed the whole page between the real due amount,
    // the error card, and the empty state on every refetch tick, even though
    // nothing about the member's actual payments had changed. Only show the
    // error wall when there's truly nothing to fall back on.
    error:
      (obligationsQuery.error && !obligationsQuery.data) ||
      (communitiesQuery.error && !communitiesQuery.data) ||
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

// A saved card is unusable for Auto-Pay once its expiry month has passed.
// Bank authorisations without expiry data never count as expired.
export function isAuthorisationExpired(auth) {
  if (!auth?.expYear || !auth?.expMonth) return false;
  const year = Number(auth.expYear);
  const month = Number(auth.expMonth);
  if (!year || !month) return false;
  const now = new Date();
  // Cards are valid through the last day of their expiry month.
  return year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);
}

// Confirmed with backend: a saved authorisation's consent is scoped per
// recurring plan, not per user -- the card used (and saved) on a plan's
// *first* payment is permanently what auto-charges that specific plan going
// forward. Reusing the same card as the save-method choice on a different
// plan attaches that existing authorisation to the new plan too rather than
// creating a duplicate, which is why one authorisation can carry several
// consents. There is no ambiguity on the backend's side about which card
// charges a given plan -- but naively picking "the first ACTIVE
// authorisation" client-side (the bug this replaces) can show/assume the
// wrong card whenever a payer has more than one recurring plan with
// different saved cards. Matches ManagePayments.jsx's existing findAuth()
// logic; centralised here so checkout screens stay consistent with it.
export function findAuthorisationForPlan(authorisations, { paymentLinkId, title, communityName } = {}) {
  for (const auth of authorisations ?? []) {
    if ((auth.status ?? "").toUpperCase() !== "ACTIVE") continue;
    const match = (auth.consents ?? []).find((c) => {
      if (c.revoked) return false;
      if (paymentLinkId && c.paymentLinkId) return c.paymentLinkId === paymentLinkId;
      return c.paymentLinkTitle === title && c.communityName === communityName;
    });
    if (match) return auth;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Manage Payments hook — saved payment authorisations (bank/channel + consents)
// ─────────────────────────────────────────────────────────────────────────────
// skipAuthRedirect: PaymentSuccess.jsx checks this right on the fragile
// post-payment landing (see its own _skipAuthRedirect usage) to decide
// whether to offer the Auto-Pay prompt -- without opting out here too, a
// transient 401 on just this one call would bypass that same protection
// and hard-sign the payer out a beat after they'd already seen "Payment
// Successful", the exact bug already fixed for the transaction-detail
// fetch on that page. Every other caller (Auto-Pay/Manage Payments
// settings, a normal ProtectedRoute-gated visit) leaves this off, so a
// genuinely dead session there still signs out normally.
export function useManagePayments({ enabled = true, skipAuthRedirect = false } = {}) {
  const queryClient = useQueryClient();
  const config = skipAuthRedirect ? { _skipAuthRedirect: true } : {};

  const query = useQuery({
    queryKey: ["authorisations"],
    queryFn: async () => {
      const res = await getMyAuthorisations(config);
      return unwrapList(res).map(shapeAuthorisation);
    },
    enabled,
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
  function toggleAutoPay(id, enabled, options) {
    if (!enabled) disableAutoPay.mutate(id, options);
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
// Pending payment verification — covers payers who never reach the callback
// page (back button, closed the Paystack tab). The pending reference stored
// before the redirect is verified once on mount so a completed payment shows
// as Paid immediately instead of waiting for the next background refetch.
// ─────────────────────────────────────────────────────────────────────────────
export function usePendingPaymentVerification() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const reference = sessionStorage.getItem("paymentPendingRef");
    if (!reference) return;
    // Remove up front — one verification attempt per stored reference is
    // enough; the callback page and background refetches cover the rest.
    sessionStorage.removeItem("paymentPendingRef");

    verifyPayment(reference)
      .then((res) => {
        const status = (res.data?.data?.status ?? "").toUpperCase();
        queryClient.invalidateQueries({ queryKey: ["obligations"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["payment-links"] });
        queryClient.invalidateQueries({ queryKey: ["authorisations"] });
        queryClient.invalidateQueries({ queryKey: ["community"] });
        if (status === "SUCCESS" || status === "SUCCESSFUL") {
          settleLocalPaymentForReference(reference);
          toastSuccess("Payment confirmed", { reference });
        }
      })
      .catch(() => {});
  }, [queryClient]);
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
