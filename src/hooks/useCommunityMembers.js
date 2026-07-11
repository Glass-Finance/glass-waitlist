import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityMembers,
  updateCommunityMember,
  removeCommunityMember,
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

// NOTE: join-request fetching/approving lives in useJoinRequests.js — a
// second hook here previously used the same query key with a different
// queryFn (status=PENDING vs all), so whichever page loaded first poisoned
// the other's cache. Keep exactly one source of truth for that key.

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
