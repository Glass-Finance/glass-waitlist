import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITIES — admin-scoped CRUD + members + payout account
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/communities
export const createCommunity = (payload) => client.post("/communities", payload);

// GET /api/v1/communities/{communityIdentifier}
export const getCommunity = (communityId) => client.get(`/communities/${communityId}`);

// PATCH /api/v1/communities/{communityIdentifier}
export const updateCommunity = (communityId, payload) =>
  client.patch(`/communities/${communityId}`, payload);

// DELETE /api/v1/communities/{communityIdentifier}
export const deleteCommunity = (communityId) =>
  client.delete(`/communities/${communityId}`);

// ─── Members ──────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/members
// Removing a member is a soft-delete on the backend (status flips off
// ACTIVE, exitedAt gets set — the row isn't dropped), so an unfiltered
// fetch keeps returning removed members forever. Default to status=ACTIVE
// unless the caller explicitly asks for something else.
export const getCommunityMembers = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/members`, {
    params: { status: "ACTIVE", ...params },
  });

// GET /api/v1/communities/{communityIdentifier}/members/{memberId}
export const getCommunityMember = (communityId, memberId) =>
  client.get(`/communities/${communityId}/members/${memberId}`);

// POST /api/v1/communities/{communityIdentifier}/members
// payload: { email, roleId, billingExempt? }
export const addCommunityMember = (communityId, payload) =>
  client.post(`/communities/${communityId}/members`, payload);

// PATCH /api/v1/communities/{communityIdentifier}/members/{memberId}
export const updateCommunityMember = (communityId, memberId, payload) =>
  client.patch(`/communities/${communityId}/members/${memberId}`, payload);

// PATCH /api/v1/communities/{communityIdentifier}/members/{memberId}/remove
// Confirmed via backend Swagger docs: "Remove community member; platform
// admins may use the same endpoint with broader permission." No request
// body needed -- DELETE on this route was 405, the Swagger only documents
// PATCH here. Mirrors the member-self-removal (leaveCommunity) which is
// also a PATCH with no body.
export const removeCommunityMember = (communityId, memberId) =>
  client.patch(`/communities/${communityId}/members/${memberId}/remove`);

// ─── Join requests (admin) ────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/join-requests
export const getCommunityJoinRequests = (communityId, params) =>
  client.get(`/communities/${communityId}/join-requests`, { params });

// PATCH /api/v1/communities/{communityIdentifier}/join-requests/{requestId}/approve
export const approveJoinRequest = (communityId, requestId) =>
  client.patch(`/communities/${communityId}/join-requests/${requestId}/approve`);

// PATCH /api/v1/communities/{communityIdentifier}/join-requests/{requestId}/reject
export const rejectJoinRequest = (communityId, requestId) =>
  client.patch(`/communities/${communityId}/join-requests/${requestId}/reject`);

// ─── Payout account ───────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/account  → data: [...]
export const getCommunityAccount = (communityId) =>
  client.get(`/communities/${communityId}/account`);

// POST /api/v1/communities/{communityIdentifier}/account
// payload: { settlementBank, settlementBankCode, accountNumber }
export const createCommunityAccount = (communityId, payload) =>
  client.post(`/communities/${communityId}/account`, payload);

// PATCH /api/v1/communities/{communityIdentifier}/account/{accountId}
// payload: { settlementBank, settlementBankCode, accountNumber }
export const updateCommunityAccount = (communityId, accountId, payload) =>
  client.patch(`/communities/${communityId}/account/${accountId}`, payload);

// PATCH /api/v1/communities/{communityIdentifier}/account/{accountId}/default
export const setDefaultCommunityAccount = (communityId, accountId) =>
  client.patch(`/communities/${communityId}/account/${accountId}/default`);

// DELETE /api/v1/communities/{communityIdentifier}/account/{accountId}
export const deleteCommunityAccount = (communityId, accountId) =>
  client.delete(`/communities/${communityId}/account/${accountId}`);


// ─── Finance — obligations ────────────────────────────────────────────────────

// PATCH /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}/waive
// payload: optional { reason }
export const waiveObligation = (communityId, obligationId, payload = {}) =>
  client.patch(`/communities/${communityId}/finance/obligations/${obligationId}/waive`, payload);