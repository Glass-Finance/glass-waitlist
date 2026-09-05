import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyObligations,
  getMyTransactions,
  getMe,
  getMyCommunities,
  getPaymentLinks,
} from "../../api/members";
import { unwrapList, deriveStatus } from "./helpers";
import {
  shapeObligation,
  shapePaymentLink,
  shapeTransaction,
  normalizeCommunity,
} from "./shape";

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
      ? (findByIdentifier(storedCommunity.slug ?? storedCommunity.id) ??
        activeCommunities[0])
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
    return linkIsActive && o.status !== "PAID";
  });

  // Payment links that are ACTIVE (or have no status set) and have no
  // corresponding obligation yet (covers plans created before the member
  // joined, or backend timing gaps).
  const unmatchedLinks = paymentLinks.filter((link) => {
    const isActive = link.linkStatus === "ACTIVE" || !link.linkStatus;
    if (!isActive) return false;
    if (obligations.some((o) => o.paymentLinkId === link.id)) return false;
    // There is no authoritative member payment status without an obligation.
    // The backend must provide the next-cycle obligation before this item can
    // be classified as paid or unpaid without client-side reconstruction.
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
    communityCount: activeCommunities.length,
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
