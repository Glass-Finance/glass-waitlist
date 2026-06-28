import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityMembers,
  addCommunityMember,
  updateCommunityMember,
  removeCommunityMember,
} from "../api/communities";
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

  const addMember = useMutation({
    mutationFn: (payload) => addCommunityMember(communityId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Member added" },
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
    addMember,
    updateMember,
    removeMember,
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
