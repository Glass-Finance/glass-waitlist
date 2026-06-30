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
// DELETE on this route is confirmed 405 (live network trace: "Request
// method 'DELETE' is not supported") -- a 405 means the route exists, just
// not for that method. The member record carries an exitedAt field that's
// null until someone leaves, and the member-initiated equivalent
// (leaveCommunity in members.js) is PATCH .../leave, so this mirrors that
// same dedicated-action shape for the admin-initiated side rather than a
// plain PATCH with a guessed status payload. Unconfirmed against the live
// backend yet -- check the actual response if this still 404s/405s.
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
