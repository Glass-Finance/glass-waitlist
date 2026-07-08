import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityAccount,
  createCommunityAccount,
  updateCommunityAccount,
  deleteCommunityAccount,
} from "../api/communities";

// The GET endpoint returns an array; defaultAccount is the flag from the API spec.
function pickDefaultAccount(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.find((a) => a.defaultAccount) ?? list[0];
}

export function useCommunityAccount(communityId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["community", communityId, "account"],
    queryFn: async () => {
      const res = await getCommunityAccount(communityId);
      // GET returns { success, data: [...] }
      const raw = res.data;
      const list = raw?.data ?? raw?.accounts ?? (Array.isArray(raw) ? raw : null);
      if (Array.isArray(list)) {
        return { accounts: list, account: pickDefaultAccount(list) };
      }
      // Single-object fallback (shouldn't happen per spec but guard anyway)
      const single = raw?.data ?? raw?.account ?? null;
      return single ? { accounts: [single], account: single } : null;
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    retry: false, // 404 = no account set up yet
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "account"] });

  // Create a brand-new payout account
  const create = useMutation({
    mutationFn: (payload) => createCommunityAccount(communityId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Payout account connected" },
  });

  // Update an existing account's bank details
  const update = useMutation({
    mutationFn: ({ accountId, payload }) =>
      updateCommunityAccount(communityId, accountId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Payout account updated" },
  });

  // Delete an existing payout account
  const remove = useMutation({
    mutationFn: (accountId) => deleteCommunityAccount(communityId, accountId),
    onSuccess: invalidate,
    meta: { successMessage: "Payout account removed" },
  });

  return {
    // Convenience: the default/first account (for the display card)
    account: query.data?.account ?? null,
    // Full list (if you ever need to show all accounts)
    accounts: query.data?.accounts ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create,
    update,
    remove,
  };
}
