import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FINANCE — community-scoped obligations + transactions
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/finance/obligations
export const getCommunityObligations = (communityId) =>
  client.get(`/communities/${communityId}/finance/obligations`);

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
  client.get(`/communities/${communityId}/finance/transactions`);
