import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunity,
  updateCommunity,
  updateCommunitySettings,
} from "../api/communities";

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
    meta: { successMessage: "Community profile updated" },
  });
}

// Joining & visibility settings (requiresMemberApproval, publicVisible) —
// optimistic so the toggle responds instantly, rolled back on failure.
export function useUpdateCommunitySettings(communityId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateCommunitySettings(communityId, payload),
    meta: { successMessage: "Community settings saved" },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["community", communityId] });
      const previous = queryClient.getQueryData(["community", communityId]);
      queryClient.setQueryData(["community", communityId], (old) =>
        old ? { ...old, ...next } : old,
      );
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["community", communityId], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      // The Discover page and community lists read publicVisible too.
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
}
