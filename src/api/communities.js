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
// There is no page-size cap on this endpoint. AppConstant.PAGE_SIZE=10 is only
// the DEFAULT used when the parameter is absent, PageQueryDto carries no
// validation annotation, createPageable passes the value straight to
// PageRequest.of, and the live OpenAPI schema declares no maximum. An earlier
// note here claimed pageSize:1000 returned 400 "Illegal Argument Entered" and
// therefore that a low cap applied: that was a MISDIAGNOSIS and is retired. The
// historical 400 was caused by pageNumber=0, because `pageNumber` is 1-BASED and
// 0 becomes PageRequest.of(-1, ...); it was never a page-size problem. See the
// full corrected account, with live evidence, in src/api/communityList.js.
//
// Single page. This is the primitive; fetchAllCommunityMembers below walks it.
export const getCommunityMembers = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/members`, {
    params: { status: "ACTIVE", ...params },
  });

// Rows requested per round trip. 200 is already driven on this backend for
// /finance/obligations/me and /finance/transactions/me, so it is in production
// use rather than a new contract. Placed BEFORE `...params` so a caller that
// passes its own pageSize still wins.
const COMMUNITY_MEMBER_PAGE_SIZE = 200;

// Backstop against a backend or proxy that never reports a terminal page, or a
// totalPages that never converges. Same named-constant style and bounded-loop
// shape as communityList.js. At 200 rows/page this implies a 40,000-row ceiling.
const MAX_MEMBER_PAGES = 200;

// Every ACTIVE member row, across all backend pages.
//
// This genuinely paginates. It previously issued ONE request with no pageSize,
// so it silently inherited AppConstant.PAGE_SIZE=10 and every community above
// 10 active members was truncated — which in turn pinned the member counts on
// Communities Home and the dashboard to 10, and capped the Members table's
// join. That was the F16 risk these comments used to describe as acceptable.
//
// Behaviour mirrors fetchCompleteMyCommunities() in src/api/communityList.js:
//   - pageNumber is 1-BASED (the backend's is too; 0 would 400)
//   - pages are fetched SEQUENTIALLY, because page N+1 does not exist until
//     page N reports whether one remains
//   - `last` is the primary termination signal, `totalPages` the second
//   - a first page carrying neither `last` nor `totalPages` means the payload
//     had no pagination metadata at all, so it is already complete
//   - an empty result reports totalPages 0, and 1 >= 0 stops immediately
//   - a request failure rejects rather than returning a short list that a
//     caller would mistake for the whole roster
//
// Returns a flat array, NOT the PageResponse envelope, so existing callers
// (and the shared ["community", id, "members"] cache shape) are unaffected.
// MAX_MEMBER_PAGES is the only way to stop short, and the truncated result is
// then indistinguishable from a complete one — the same limitation the
// communities walk has, and why the limit is generous.
export async function fetchAllCommunityMembers(communityId, params = {}) {
  const aggregated = [];
  let pageNumber = 1;

  for (let page = 0; page < MAX_MEMBER_PAGES; page += 1) {
    const res = await getCommunityMembers(communityId, {
      pageSize: COMMUNITY_MEMBER_PAGE_SIZE,
      ...params,
      pageNumber,
    });
    const data = res.data?.data;

    // Tolerate a plain-array payload (no envelope) as the previous single-fetch
    // version did: there is no pagination state to consult, so it is complete.
    if (Array.isArray(data)) return [...aggregated, ...data];

    aggregated.push(...(data?.content ?? []));

    if (data?.last === true) break;
    if (data?.last === undefined && data?.totalPages === undefined) break;
    if (pageNumber >= (data?.totalPages ?? Number.POSITIVE_INFINITY)) break;
    pageNumber += 1;
  }

  return aggregated;
}

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
