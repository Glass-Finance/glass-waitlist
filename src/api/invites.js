import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY INVITE API
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/invites/me
// — list all invites for the authenticated user (used on empty state screen)
export const getMyInvites = () =>
  client.get("/communities/invites/me");

// GET /api/v1/communities/invites/{inviteId}
export const getInvite = (inviteId) =>
  client.get(`/communities/invites/${inviteId}`);

// PATCH /api/v1/communities/{communityIdentifier}/invites/{inviteId}/accept
export const acceptInvite = (communityId, inviteId) =>
  client.patch(`/communities/${communityId}/invites/${inviteId}/accept`);

// PATCH /api/v1/communities/{communityIdentifier}/invites/{inviteId}/reject
export const rejectInvite = (communityId, inviteId) =>
  client.patch(`/communities/${communityId}/invites/${inviteId}/reject`);

// PATCH /api/v1/communities/{communityIdentifier}/invites/{inviteId}/revoke
// (admin only — included for completeness)
export const revokeInvite = (communityId, inviteId) =>
  client.patch(`/communities/${communityId}/invites/${inviteId}/revoke`);

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY JOIN REQUEST API
// For organic joins (no invite link) — user submits a join request
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/communities/{communityIdentifier}/join-requests
export const submitJoinRequest = (communityId) =>
  client.post(`/communities/${communityId}/join-requests`);

// GET /api/v1/communities/join-requests/me
// (Bare /join-requests/me is not documented — removed.)
export const getMyCommunityJoinRequests = () =>
  client.get("/communities/join-requests/me");
