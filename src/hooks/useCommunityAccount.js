import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommunityAccount, saveCommunityAccount } from "../api/communities";

export function useCommunityAccount(communityId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["community", communityId, "account"],
    queryFn: async () => {
      const res = await getCommunityAccount(communityId);
      // Backend may wrap in { success, data: {...} } or return the object directly.
      // Also handles { data: [account] } (array) or { data: { accounts: [...] } }.
      const raw = res.data;
      let account =
        raw?.data ??
        raw?.account ??
        (Array.isArray(raw) ? raw[0] : null) ??
        null;
      // If the extracted value is an array (paginated list), take first item
      if (Array.isArray(account)) account = account[0] ?? null;
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[useCommunityAccount] raw:", raw, "→ account:", account);
      }
      return account ?? null;
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    retry: false, // a 404 here just means no account has been set up yet
  });

  const save = useMutation({
    mutationFn: (payload) => saveCommunityAccount(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId, "account"] });
    },
    meta: { successMessage: "Payout account connected" },
  });

  return {
    account: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save,
  };
}
