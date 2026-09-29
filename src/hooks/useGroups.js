import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityGroups,
  getCommunityGroupMembers,
  createCommunityGroup,
  updateCommunityGroup,
  deleteCommunityGroup,
  archiveCommunityGroup,
  unarchiveCommunityGroup,
  addCommunityGroupMembers,
  removeCommunityGroupMembers,
} from "../api/groups";

// The group list is paginated like every other community list, so unwrap the
// envelope once here rather than in each call site.
function unwrapPage(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 };
  return {
    content: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 1,
    pageNumber: data?.pageNumber ?? 0,
  };
}

/**
 * Whether a group is archived.
 *
 * `status` is the authoritative field, and its values are fixed by the backend
 * enum `CommunityMemberGroupStatus { ACTIVE, ARCHIVED }` — so this is a plain
 * equality check. It was previously a loose `/ARCHIV/` match with an `archivedAt`
 * fallback, written while the enum was unconfirmed. That fallback is gone rather
 * than kept alongside, so a status the backend never sends can't be silently
 * treated as archived.
 */
export function isArchivedGroup(group) {
  return group?.status === "ARCHIVED";
}

export function useCommunityGroups(communityId, params = {}) {
  return useQuery({
    queryKey: ["community", communityId, "groups", params],
    queryFn: async () => unwrapPage(await getCommunityGroups(communityId, params)),
    enabled: !!communityId,
    staleTime: 1000 * 30,
  });
}

export function useCommunityGroupMembers(
  communityId,
  groupId,
  params = {},
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: ["community", communityId, "groups", groupId, "members", params],
    queryFn: async () => unwrapPage(await getCommunityGroupMembers(communityId, groupId, params)),
    enabled: enabled && !!communityId && !!groupId,
    staleTime: 1000 * 30,
  });
}

/**
 * Every group mutation, so the Groups page wires one object rather than eight
 * hooks, and so a membership change can invalidate the group list too — member
 * counts shown next to a group go stale the moment somebody is added.
 */
export function useGroupMutations(communityId) {
  const queryClient = useQueryClient();

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "groups"] });
  };
  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ["community", communityId, "members"] });
  };

  // `meta.successMessage` is toasted centrally by the QueryClient cache in
  // main.jsx — the same convention useCommunityMembers uses. Doing it here keeps
  // the page free of per-mutation toast plumbing.
  const done = (successMessage) => ({
    meta: { successMessage },
    onSuccess: () => {
      invalidateGroups();
      invalidateMembers();
    },
  });

  return {
    create: useMutation({
      mutationFn: (payload) => createCommunityGroup(communityId, payload),
      ...done("Group created"),
    }),
    update: useMutation({
      mutationFn: ({ groupId, ...payload }) => updateCommunityGroup(communityId, groupId, payload),
      ...done("Group updated"),
    }),
    remove: useMutation({
      mutationFn: (groupId) => deleteCommunityGroup(communityId, groupId),
      ...done("Group deleted"),
    }),
    archive: useMutation({
      mutationFn: (groupId) => archiveCommunityGroup(communityId, groupId),
      ...done("Group archived"),
    }),
    unarchive: useMutation({
      mutationFn: (groupId) => unarchiveCommunityGroup(communityId, groupId),
      ...done("Group restored"),
    }),
    addMembers: useMutation({
      mutationFn: ({ groupId, memberIds }) =>
        addCommunityGroupMembers(communityId, groupId, memberIds),
      ...done("Members added"),
    }),
    removeMembers: useMutation({
      mutationFn: ({ groupId, memberIds }) =>
        removeCommunityGroupMembers(communityId, groupId, memberIds),
      ...done("Members removed"),
    }),
  };
}
