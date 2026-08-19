import client from "./client";
import { fetchAllPages } from "./pagination";

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

// PATCH /api/v1/communities/{communityIdentifier}/settings
// payload: { requiresMemberApproval?, publicVisible? }
// requiresMemberApproval — join requests need manual admin approval (the
// backend defaults this to false at creation, so anyone can join from the
// Discover page instantly until the admin flips it here).
// publicVisible — whether the community appears in Discover search.
export const updateCommunitySettings = (communityId, payload) =>
  client.patch(`/communities/${communityId}/settings`, payload);

// DELETE /api/v1/communities/{communityIdentifier}
export const deleteCommunity = (communityId) =>
  client.delete(`/communities/${communityId}`);

// ─── Members ──────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/members
// Removing a member is a soft-delete on the backend (status flips off
// ACTIVE, exitedAt gets set — the row isn't dropped), so an unfiltered
// fetch keeps returning removed members forever. Default to status=ACTIVE
// unless the caller explicitly asks for something else. pageSize:1000 is a
// default, not a hard cap -- params can override page/pageSize for a caller
// that needs to page through a community with more members than that (see
// fetchAllCommunityMembers below).
export const getCommunityMembers = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/members`, {
    params: { status: "ACTIVE", pageSize: 1000, ...params },
  });

// Pages through every member rather than trusting a single capped fetch --
// a community with more members than one page's worth would otherwise have
// its roster, headcount, and CSV-adjacent aggregates silently truncated at
// whatever the first page happened to return.
export const fetchAllCommunityMembers = (communityId, params = {}) =>
  fetchAllPages((pageNumber) => getCommunityMembers(communityId, { ...params, pageNumber }));

// GET /api/v1/communities/{communityIdentifier}/members/{memberId}
export const getCommunityMember = (communityId, memberId) =>
  client.get(`/communities/${communityId}/members/${memberId}`);

// POST /api/v1/communities/{communityIdentifier}/members
// payload: { email, roleId, billingExempt?, phoneNumber?, phoneRegion? }
// Not currently called by any UI in this app — member creation goes through
// the invites endpoints (src/api/invites.js) instead, which don't accept
// phoneRegion. Kept phoneRegion-ready in case that changes.
export const addCommunityMember = (communityId, payload) =>
  client.post(`/communities/${communityId}/members`, payload);

// POST /api/v1/communities/{communityIdentifier}/members/bulk
// payload: { members: [{ email, roleId, billingExempt?, phoneNumber?, phoneRegion? }] }
// Same caveat as addCommunityMember above -- not called anywhere yet.
export const bulkAddCommunityMembers = (communityId, payload) =>
  client.post(`/communities/${communityId}/members/bulk`, payload);

// PATCH /api/v1/communities/{communityIdentifier}/members/{memberId}
// payload can include phoneNumber/phoneRegion -- only ever called with
// { roleId } today (see MemberAccess.jsx's promote/demote).
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

// GET /api/v1/communities/{communityIdentifier}/search
// Admin-scoped global search within one community (Topbar's search bar) --
// distinct from searchPublicCommunities below, which searches the public
// directory of communities themselves, not within one.
export const searchCommunity = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/search`, { params });

// GET /api/v1/public/communities/search
// Public directory search — no auth-scoped community membership required,
// used by members with zero communities to discover ones to request
// joining. Follows the same { search, page, size } convention as
// getAdminCommunities / getAdminUsers elsewhere in this codebase.
export const searchPublicCommunities = (params = {}) =>
  client.get(`/public/communities/search`, { params });

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