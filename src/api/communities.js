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

// ─── Members ──────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/members
export const getCommunityMembers = (communityId) =>
  client.get(`/communities/${communityId}/members`);

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

// ─── Payout account ───────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/account
export const getCommunityAccount = (communityId) =>
  client.get(`/communities/${communityId}/account`);

// POST /api/v1/communities/{communityIdentifier}/account
// payload: { settlementBank, settlementBankCode, accountNumber }
export const saveCommunityAccount = (communityId, payload) =>
  client.post(`/communities/${communityId}/account`, payload);
