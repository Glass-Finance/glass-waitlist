import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommunityAccount, saveCommunityAccount } from "../api/communities";

export function useCommunityAccount(communityId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["community", communityId, "account"],
    queryFn: async () => {
      const res = await getCommunityAccount(communityId);
      return res.data?.data ?? null;
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
