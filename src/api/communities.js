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

// PATCH /api/v1/communities/{communityIdentifier}/settings
// payload: { requiresMemberApproval?, publicVisible? }
// requiresMemberApproval — join requests need manual admin approval (the
// backend defaults this to false at creation, so anyone can join from the
// Discover page instantly until the admin flips it here).
// publicVisible — whether the community appears in Discover search.
export const updateCommunitySettings = (communityId, payload) =>
  client.patch(`/communities/${communityId}/settings`, payload);

// DELETE /api/v1/communities/{communityIdentifier}
export const deleteCommunity = (communityId) => client.delete(`/communities/${communityId}`);

// ─── Members ──────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/members
// Removing a member is a soft-delete on the backend (status flips off
// ACTIVE, exitedAt gets set — the row isn't dropped), so an unfiltered
// fetch keeps returning removed members forever. Default to status=ACTIVE
// unless the caller explicitly asks for something else.
//
// Deliberately no pageSize override here, unlike getCommunityObligations/
// getCommunityTransactions. The earlier note on this endpoint claimed it
// "returned 400 Illegal Argument Entered for pageSize:1000" and therefore
// enforced some low cap: that was a MISDIAGNOSIS and is retired. There is no
// such cap. The backend imposes NO maximum page size — AppConstant.PAGE_SIZE=10
// is only the DEFAULT used when the parameter is absent, PageQueryDto carries no
// validation annotation, createPageable passes the value straight to
// PageRequest.of, and the live OpenAPI schema declares no maximum. pageSize:1000
// is accepted here just as it is on the sibling endpoints. The historical 400
// was caused by pageNumber=0, because `pageNumber` is 1-BASED and 0 becomes
// PageRequest.of(-1, ...); it was never a page-size problem. See the full
// corrected account, with live evidence, in src/api/communityList.js.
//
// CONSEQUENCE, left as-is here: sending no pageSize means this request takes the
// backend default of 10, so a community with more than 10 members has its list
// truncated. Fixing that is separate work from this comment correction.
export const getCommunityMembers = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/members`, {
    params: { status: "ACTIVE", ...params },
  });

// Intentionally ONE request, not a page walk — so this list is not guaranteed
// complete: a community with more members than fit in one page (see the
// default-10 note above) may have its roster/headcount silently truncated (the
// original F16 risk). The limit is this helper's choice, NOT a backend
// constraint. Callers needing a guaranteed-complete roster should pass an
// explicit pageSize, or page with a 1-based pageNumber.
export const fetchAllCommunityMembers = (communityId, params = {}) =>
  getCommunityMembers(communityId, params).then((res) => {
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  });

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
