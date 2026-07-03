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

// GET /api/v1/communities/{communityIdentifier}/invites
// — admin: list all invites for a community (filterable by status)
export const getCommunityInvites = (communityId, params) =>
  client.get(`/communities/${communityId}/invites`, { params });

// POST /api/v1/communities/{communityIdentifier}/invites
// — admin: invite a registered user by email; backend sends the invite email
// payload: { email, roleId, billingExempt? }
export const createCommunityInvite = (communityId, payload) =>
  client.post(`/communities/${communityId}/invites`, payload);

// PATCH /api/v1/communities/invites/{inviteId}/accept
export const acceptInvite = (inviteId) =>
  client.patch(`/communities/invites/${inviteId}/accept`);

// PATCH /api/v1/communities/invites/{inviteId}/reject
export const rejectInvite = (inviteId) =>
  client.patch(`/communities/invites/${inviteId}/reject`);

// PATCH /api/v1/communities/{communityIdentifier}/invites/{inviteId}/revoke
// (admin only)
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
