import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "../api/communities";

function unwrap(res) {
  const d = res.data?.data;
  return Array.isArray(d) ? d : (d?.content ?? []);
}

export function useJoinRequests(communityId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["community", communityId, "join-requests"],
    queryFn: async () => unwrap(await getCommunityJoinRequests(communityId)),
    enabled: !!communityId,
    staleTime: 1000 * 30,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "join-requests"] });
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "members"] });
  };

  const approve = useMutation({
    mutationFn: (requestId) => approveJoinRequest(communityId, requestId),
    onSuccess: invalidate,
    meta: { successMessage: "Request approved — they're now a member" },
  });

  const reject = useMutation({
    mutationFn: (requestId) => rejectJoinRequest(communityId, requestId),
    onSuccess: invalidate,
    meta: { successMessage: "Request rejected" },
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    approve: approve.mutateAsync,
    reject: reject.mutateAsync,
    isMutating: approve.isPending || reject.isPending,
  };
}