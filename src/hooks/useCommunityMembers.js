import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityMembers,
  updateCommunityMember,
  removeCommunityMember,
  getCommunityJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "../api/communities";
import { createCommunityInvite } from "../api/invites";
import { getRoles } from "../api/roles";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

export function useCommunityMembers(communityId) {
  const queryClient = useQueryClient();
  const enabled = !!communityId;

  const query = useQuery({
    queryKey: ["community", communityId, "members"],
    queryFn: async () => {
      const res = await getCommunityMembers(communityId);
      return unwrapList(res);
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "members"] });
  }

  const inviteMember = useMutation({
    mutationFn: (payload) => createCommunityInvite(communityId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Invite sent" },
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, payload }) => updateCommunityMember(communityId, memberId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Member updated" },
  });

  const removeMember = useMutation({
    mutationFn: (memberId) => removeCommunityMember(communityId, memberId),
    onSuccess: invalidate,
    meta: { successMessage: "Member removed" },
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    inviteMember,
    updateMember,
    removeMember,
  };
}

export function useCommunityJoinRequests(communityId) {
  const queryClient = useQueryClient();
  const enabled = !!communityId;

  const query = useQuery({
    queryKey: ["community", communityId, "join-requests"],
    queryFn: async () => {
      const res = await getCommunityJoinRequests(communityId, { status: "PENDING" });
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled,
    staleTime: 1000 * 60,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "join-requests"] });
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "members"] });
  }

  const approve = useMutation({
    mutationFn: (requestId) => approveJoinRequest(communityId, requestId),
    onSuccess: invalidate,
    meta: { successMessage: "Request approved" },
  });

  const reject = useMutation({
    mutationFn: (requestId) => rejectJoinRequest(communityId, requestId),
    onSuccess: invalidate,
    meta: { successMessage: "Request rejected" },
  });

  return {
    joinRequests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    approve: (id) => approve.mutateAsync(id),
    reject: (id) => reject.mutateAsync(id),
    isActing: approve.isPending || reject.isPending,
  };
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await getRoles();
      return unwrapList(res);
    },
    staleTime: 1000 * 60 * 30,
  });
}
