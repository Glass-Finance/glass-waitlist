import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommunity, updateCommunity } from "../api/communities";

export function useCommunity(communityId) {
  return useQuery({
    queryKey: ["community", communityId],
    queryFn: async () => {
      const res = await getCommunity(communityId);
      return res.data?.data ?? res.data;
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateCommunity(communityId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateCommunity(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
    },
  });
}
