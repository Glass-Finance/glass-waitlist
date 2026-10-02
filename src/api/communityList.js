/**
 * src/api/communityList.js
 *
 * ONE implementation of "give me the complete list of communities this user
 * belongs to". Shared by the dashboard hook and by AuthContext's admin-standing
 * derivation, which cannot use a React hook (it runs in async bootstrap
 * functions) and must not own a second copy of the walk.
 *
 * GET /api/v1/communities/me returns a PAGINATED envelope:
 *   { content: [...], pageNumber, pageSize, totalElements, totalPages, last }
 * and defaults to AppConstant.PAGE_SIZE = 10, so a single request is NOT the
 * user's community set. Two consumers were bitten by that:
 *
 *   - useCommunities(): CommunitiesHome rendered an under-full grid, Topbar
 *     and useNotifications could not resolve an off-page community, and
 *     Sidebar's `adminCommunities.length === 1` inference could fire for an
 *     admin whose other administered communities were not in the response.
 *   - AuthContext: hasAdminCommunity() ran over the first page only, so a
 *     legitimate community admin whose administered community sorted past
 *     row 10 was classified isAdmin: false and locked out of every
 *     admin-gated route by ProtectedRoute.
 *
 * Deliberately NOT named fetchAll*Community*: every existing fetchAll* helper
 * in src/api (fetchAllCommunityMembers, fetchAllCommunityObligations,
 * fetchAllCommunityTransactions) means "one request, unwrapped to an array",
 * and each carries a comment saying it does not paginate. Reusing that prefix
 * for a real page walk would make the prefix mean two opposite things.
 *
 * pageNumber is 1-based because the backend's is: createPageable() does
 * PageRequest.of(pageNumber - 1, ...), so 0 becomes PageRequest.of(-1, ...) and
 * the request is rejected with 400 "Illegal Argument Entered" — confirmed live.
 * Pages are fetched SEQUENTIALLY because page N+1 does not exist until page N
 * reports whether one remains.
 *
 * pageSize is requested explicitly (see COMMUNITY_PAGE_SIZE below). Nothing in
 * the backend caps it: PageQueryDto carries no validation annotation,
 * createPageable passes the value straight to PageRequest.of, and the live
 * OpenAPI schema declares no maximum. The same PageQueryDto base is already
 * driven with pageSize:200 in production by /finance/obligations/me and
 * /finance/transactions/me.
 *
 * The "pageSize:1000 caused a 400" note that used to live in api/communities.js
 * was a MISDIAGNOSIS and is retired. That request also carried pageNumber=0
 * (from a since-deleted `fetchAllPages` helper that started at 0), which becomes
 * PageRequest.of(-1, ...) and is what actually raised
 * IllegalArgumentException -> 400 "Illegal Argument Entered". Confirmed live on
 * the identical PageQueryDto path: pageNumber=0&pageSize=2 -> 400, while
 * pageNumber=1&pageSize=1000 -> 200.
 */
import client from "./client";

// Safety valve, in the same bounded-loop style useExportJob.js uses for its poll
// loop (a named MAX_* constant plus a counter). The three termination signals in
// the loop below are independent guards, so this is the backstop for a backend
// or proxy that reports `last: false` on its final page, or a totalPages that
// never converges -- without it a malformed response would walk forever.
const MAX_PAGES = 200;

// Rows requested per round trip. AppConstant.PAGE_SIZE = 10 is the backend's
// DEFAULT when the parameter is absent, not a maximum — so 10 only ever cost us
// ceil(N/10) sequential requests to reach the same complete list the walk was
// already fetching page by page. 200 is the same value this backend is already
// driven with on /finance/obligations/me and /finance/transactions/me
// (api/members.js), so it is in production use rather than a new contract.
//
// Placed BEFORE `...params` in the request below, so a caller that passes its
// own pageSize still wins; `pageNumber` stays last because the walk owns it.
const COMMUNITY_PAGE_SIZE = 200;

/**
 * Fetch every page of GET /communities/me and return one aggregated envelope.
 *
 * @param {object}  [options]
 * @param {Record<string, unknown>}  [options.params]  query params merged into
 *                                    each request; a caller-supplied pageSize
 *                                    overrides COMMUNITY_PAGE_SIZE.
 *                                    `pageNumber` is owned by this walk.
 * @param {Record<string, unknown>}  [options.config]  axios config merged into
 *                                    each request (e.g. `_skipAuthRedirect`).
 * @returns {Promise<Record<string, unknown>>} the aggregated envelope.
 *   `content` holds every community; `totalElements` is the backend's own total.
 */
export async function fetchCompleteMyCommunities({ params = {}, config = {} } = {}) {
  const aggregated = [];
  /** @type {Record<string, unknown> | null} */
  let firstPage = null;
  let totalElements = 0;
  let pageSize = 0;
  let pageNumber = 1;

  for (let attempt = 1; attempt <= MAX_PAGES; attempt += 1) {
    const res = await client.get("/communities/me", {
      ...config,
      params: { pageSize: COMMUNITY_PAGE_SIZE, ...params, pageNumber },
    });
    const page = res.data.data ?? {};

    if (firstPage === null) {
      firstPage = page;
      totalElements = page.totalElements ?? 0;
      pageSize = page.pageSize ?? 0;
    }
    aggregated.push(...(page.content ?? []));

    // `last` is the backend's own answer and the primary signal. `totalPages`
    // is the second, for a response that omits `last`. A missing `last` on the
    // first page means the payload carried no pagination metadata at all, so it
    // is a complete result and asking for page 2 would be wrong. An empty
    // result reports totalPages 0, and 1 >= 0 stops the walk immediately.
    if (page.last === true) break;
    if (page.last === undefined && page.totalPages === undefined) break;
    if (pageNumber >= (page.totalPages ?? Number.POSITIVE_INFINITY)) break;
    pageNumber += 1;
  }

  // A single envelope describing the whole collection -- totalPages 1, last
  // true -- so nothing downstream can mistake it for a partial page and fetch
  // more. Only this one value is ever cached by a caller; the intermediate
  // responses are not cached separately and need not be, since no observer ever
  // asks this layer for one page of the list.
  return {
    ...firstPage,
    content: aggregated,
    pageNumber: 1,
    pageSize,
    // The backend total, not `aggregated.length`: a walk cut short by
    // MAX_PAGES has fewer rows than it claims, and that mismatch is the only
    // signal left that this list is incomplete.
    totalElements,
    totalPages: 1,
    last: true,
  };
}

/**
 * The community objects alone, from the same complete walk. Convenience for
 * callers that only need the array (AuthContext's admin-standing check).
 *
 * @param {object} [options] same shape as fetchCompleteMyCommunities
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function fetchCompleteMyCommunityList(options) {
  const envelope = await fetchCompleteMyCommunities(options);
  const content = envelope.content;
  return Array.isArray(content) ? content : [];
}
