import { useQuery } from "@tanstack/react-query";
import { getCommunitySettlements, getCommunitySettlement } from "../api/transactions";

// The settlements list is paginated like every other community list, so the
// envelope is unwrapped once here rather than at each call site. Same shape as
// useGroups.js — PageResponse<CommunitySettlementResponse>.
//
// `pageNumber` comes back from the backend and is kept because the page's
// pager is 1-based (see useGroups.js / Groups.jsx: pageNumber=0 is what turned
// a historical 400 into a misdiagnosis on the sibling finance endpoints).
function unwrapPage(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) {
    return { content: data, totalElements: data.length, totalPages: 1, pageNumber: 1 };
  }
  return {
    content: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 1,
    pageNumber: data?.pageNumber ?? 1,
  };
}

export function useCommunitySettlements(communityId, params = {}) {
  return useQuery({
    queryKey: ["community", communityId, "settlements", params],
    queryFn: async () => unwrapPage(await getCommunitySettlements(communityId, params)),
    enabled: !!communityId,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

/**
 * One settlement with its matched transactions.
 *
 * `404` is an expected outcome, not only an error: the backend hides
 * MISMATCHED and REVIEWED settlements from community callers at the detail
 * endpoint as well as in the list, so a row can disappear between the click and
 * the fetch. The page turns that into an "no longer available" panel, so this
 * hook deliberately does not swallow it.
 */
export function useCommunitySettlement(communityId, settlementId) {
  return useQuery({
    queryKey: ["community", communityId, "settlement", settlementId],
    queryFn: async () => {
      const res = await getCommunitySettlement(communityId, settlementId);
      return res.data?.data ?? res.data;
    },
    enabled: !!communityId && !!settlementId,
    staleTime: 1000 * 30,
  });
}
