import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FINANCE — community-scoped obligations + transactions
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/finance/obligations
// pageSize:1000 predates this comment and was already shipping fine. A
// `pageNumber` param was once added on top of it and "confirmed live to return
// 400 Illegal Argument Entered" — that reading was a MISDIAGNOSIS, and it has
// been retired. `pageNumber` is supported on these endpoints and is 1-BASED:
// the backend's createPageable() does PageRequest.of(pageNumber - 1, ...), so
// pageNumber=0 becomes PageRequest.of(-1, ...) and that — not pageSize, and not
// any unsupported-parameter problem — is what actually raised
// IllegalArgumentException -> 400. The offending request came from a since-
// deleted `fetchAllPages` helper that started its walk at 0. Confirmed live on
// the identical PageQueryDto path: pageNumber=0&pageSize=2 -> 400, while
// pageNumber=1&pageSize=1000 -> 200. Nothing caps pageSize: PageQueryDto carries
// no validation annotation, createPageable passes the value straight to
// PageRequest.of, and the live OpenAPI schema declares no maximum. See
// src/api/communityList.js for the full corrected account.
export const getCommunityObligations = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/finance/obligations`, {
    params: { pageSize: 1000, ...params },
  });

// Intentionally ONE request, not a page walk — so this list is not guaranteed
// complete: a community with more obligations than fit in one page may have its
// list silently truncated (the original F03/F16 risk). The limit is this
// helper's choice, NOT a backend constraint. Anyone needing a guaranteed-
// complete list should page explicitly with a 1-based pageNumber, or use the
// page-walking helper in src/api/communityList.js.
export const fetchAllCommunityObligations = (communityId) =>
  getCommunityObligations(communityId).then((res) => {
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  });

// GET /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}
export const getCommunityObligation = (communityId, obligationId) =>
  client.get(`/communities/${communityId}/finance/obligations/${obligationId}`);

// waiveObligation lives in api/communities.js (it also accepts an optional
// { reason } payload) -- kept there as the single source of truth.

// PATCH /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}/extend-due-date
export const extendObligationDueDate = (communityId, obligationId, dueAt) =>
  client.patch(`/communities/${communityId}/finance/obligations/${obligationId}/extend-due-date`, {
    dueAt,
  });

// GET /api/v1/communities/{communityIdentifier}/finance/transactions
// See the corrected pagination explanation on getCommunityObligations above:
// `pageNumber` IS supported and is 1-based, pageSize:1000 IS accepted, and the
// historical 400 was caused by pageNumber=0 — not by pageSize, and not by any
// unsupported-parameter problem on this endpoint.
export const getCommunityTransactions = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/finance/transactions`, {
    params: { pageSize: 1000, ...params },
  });

// Intentionally ONE request, not a page walk — so this list is not guaranteed
// complete: a community with more than 1000 transactions has the oldest ones
// silently dropped (the original F03 risk). The limit is this helper's choice,
// NOT a backend constraint; see the corrected pagination notes above.
//
// Note this list is NOT an authoritative "total collected". The backend's own
// metrics.collectedAmount is a server-side aggregate with no page limit, and it
// covers obligations plus unallocated successful payment-link transactions. It
// is the more complete source for a collected total. This helper remains the
// source for per-member payment status (last payment date, failed-payment
// counts), which metrics does not expose — useMembersWithPayments needs those.
export const fetchAllCommunityTransactions = (communityId) =>
  getCommunityTransactions(communityId).then((res) => {
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  });

// GET /api/v1/communities/{communityIdentifier}/finance/transactions/{transactionId}
export const getCommunityTransaction = (communityId, transactionId) =>
  client.get(`/communities/${communityId}/finance/transactions/${transactionId}`);
