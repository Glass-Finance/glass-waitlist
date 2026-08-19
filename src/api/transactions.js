import client from "./client";
import { fetchAllPages } from "./pagination";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FINANCE — community-scoped obligations + transactions
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/finance/obligations
// These endpoints are paginated server-side (content/pageNumber/pageSize/
// totalElements). pageSize:1000 is a default, not a hard cap -- params can
// override page/pageSize for a caller that needs to page through a
// community with more obligations than that (see fetchAllCommunityObligations
// below). Without this, a single fetch would silently truncate the list for
// any community with more than a page's worth of obligations, breaking the
// per-member aggregates the Members page derives from this data.
export const getCommunityObligations = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/finance/obligations`, { params: { pageSize: 1000, ...params } });

// Pages through every obligation rather than trusting a single capped fetch.
export const fetchAllCommunityObligations = (communityId) =>
  fetchAllPages((pageNumber) => getCommunityObligations(communityId, { pageNumber }));

// GET /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}
export const getCommunityObligation = (communityId, obligationId) =>
  client.get(`/communities/${communityId}/finance/obligations/${obligationId}`);

// waiveObligation lives in api/communities.js (it also accepts an optional
// { reason } payload) -- kept there as the single source of truth.

// PATCH /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}/extend-due-date
export const extendObligationDueDate = (communityId, obligationId, dueAt) =>
  client.patch(
    `/communities/${communityId}/finance/obligations/${obligationId}/extend-due-date`,
    { dueAt }
  );

// GET /api/v1/communities/{communityIdentifier}/finance/transactions
// pageSize:1000 is a default, not a hard cap -- params can override page/
// pageSize for a caller that needs to page through a community with more
// transactions than that (see fetchAllCommunityTransactions below).
export const getCommunityTransactions = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/finance/transactions`, { params: { pageSize: 1000, ...params } });

// Pages through every transaction rather than trusting a single capped
// fetch -- the backend's own collectedAmount metric only tracks settlements
// and returns 0 even when members have paid in full (see useCommunities.js),
// so callers that need an accurate collected total or per-member payment
// status derive it from the full transaction list instead. A single page
// would silently understate that for any community with more transactions
// than fit in one (see AUDIT_REPORT.md, F03).
export const fetchAllCommunityTransactions = (communityId) =>
  fetchAllPages((pageNumber) => getCommunityTransactions(communityId, { pageNumber }));

// GET /api/v1/communities/{communityIdentifier}/finance/transactions/{transactionId}
export const getCommunityTransaction = (communityId, transactionId) =>
  client.get(`/communities/${communityId}/finance/transactions/${transactionId}`);
