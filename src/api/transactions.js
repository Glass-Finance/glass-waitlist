import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN FINANCE — community-scoped obligations + transactions
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/finance/obligations
// pageSize:1000 predates this comment and was already shipping fine. Adding
// a `pageNumber` param on top of it (below) was confirmed live to return 400
// "Illegal Argument Entered" -- for a 1-member community, so this isn't a
// page-2-and-beyond edge case, the very first request fails. The same
// pageNumber addition broke getCommunityMembers and getCommunityTransactions
// identically, which points at this backend not accepting a `pageNumber`
// param on these list endpoints at all (wrong param name, or no page-2+
// support), not at pageSize specifically. Reverted to a single fetch with no
// pageNumber until the actual accepted pagination scheme is confirmed --
// don't guess a third time.
export const getCommunityObligations = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/finance/obligations`, { params: { pageSize: 1000, ...params } });

// NOT currently paginated -- see the comment on getCommunityObligations
// above. A community with more than one page's worth of obligations may
// still have this list silently truncated (the original F03/F16 risk);
// that's preferable to every community being hard-broken by an unsupported
// param.
export const fetchAllCommunityObligations = (communityId) =>
  getCommunityObligations(communityId).then((res) => {
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  });

// GET /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}
export const getCommunityObligation = (communityId, obligationId) =>
  client.get(`/communities/${communityId}/finance/obligations/${obligationId}`);

// waiveObligation lives in api/communities.js (it also accepts an optional
// { reason } payload) -- kept there as the single source of truth.

// PATCH /api/v1/communities/{communityIdentifier}/finance/obligations/{obligationId}/extend-due-date
export const extendObligationDueDate = (communityId, obligationId, dueAt) =>
  client.patch(
    `/communities/${communityId}/finance/obligations/${obligationId}/extend-due-date`,
    { dueAt }
  );

// GET /api/v1/communities/{communityIdentifier}/finance/transactions
// See the comment on getCommunityObligations above -- a `pageNumber` param
// added on top of this endpoint's existing pageSize:1000 was confirmed live
// to return 400 "Illegal Argument Entered", for every community regardless
// of size. Reverted to a single fetch with no pageNumber.
export const getCommunityTransactions = (communityId, params = {}) =>
  client.get(`/communities/${communityId}/finance/transactions`, { params: { pageSize: 1000, ...params } });

// NOT currently paginated -- see the comment on getCommunityTransactions
// above. The backend's own collectedAmount metric only tracks settlements
// and returns 0 even when members have paid in full (see useCommunities.js),
// so callers that need an accurate collected total or per-member payment
// status still derive it from this list rather than that metric -- it's
// just not guaranteed complete for a community with more than one page's
// worth of transactions (the original F03 risk), which is preferable to
// every community being hard-broken by an unsupported param.
export const fetchAllCommunityTransactions = (communityId) =>
  getCommunityTransactions(communityId).then((res) => {
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
  });

// GET /api/v1/communities/{communityIdentifier}/finance/transactions/{transactionId}
export const getCommunityTransaction = (communityId, transactionId) =>
  client.get(`/communities/${communityId}/finance/transactions/${transactionId}`);
