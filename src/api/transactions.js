import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FINANCE — community-scoped obligations + transactions
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/finance/obligations
// These endpoints are paginated server-side (content/pageNumber/pageSize/
// totalElements) — without an explicit pageSize, the backend's default
// page would silently truncate the list for any community with more
// than a page's worth of obligations, breaking the per-member aggregates
// the Members page derives from this data. Members.jsx and the admin
// dashboard need the full set to join against, not one page of it.
export const getCommunityObligations = (communityId) =>
  client.get(`/communities/${communityId}/finance/obligations`, { params: { pageSize: 1000 } });

// GET /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}
export const getCommunityObligation = (communityId, obligationId) =>
  client.get(`/communities/${communityId}/finance/obligations/${obligationId}`);

// PATCH /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}/waive
export const waiveObligation = (communityId, obligationId) =>
  client.patch(`/communities/${communityId}/finance/obligations/${obligationId}/waive`);

// PATCH /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}/extend-due-date
export const extendObligationDueDate = (communityId, obligationId, dueAt) =>
  client.patch(
    `/communities/${communityId}/finance/obligations/${obligationId}/extend-due-date`,
    { dueAt }
  );

// GET /api/v1/communities/{communityIdentifier}/finance/transactions
export const getCommunityTransactions = (communityId) =>
  client.get(`/communities/${communityId}/finance/transactions`, { params: { pageSize: 1000 } });
