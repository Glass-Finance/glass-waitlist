// import { useEffect, useState } from "react";

// import {
//   getMyInvites,
//   acceptInvite,
//   rejectInvite,
// } from "../api/invites";

// export function useInvites() {
//   const [invites, setInvites] = useState([]);
//   const [loading, setLoading] = useState(true);

//   async function fetchInvites() {
//     try {
//       const res = await getMyInvites();

//       setInvites(res.data.data || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function accept(communityId, inviteId) {
//     await acceptInvite(communityId, inviteId);

//     setInvites((prev) =>
//       prev.filter((i) => i.id !== inviteId)
//     );
//   }

//   async function reject(communityId, inviteId) {
//     await rejectInvite(communityId, inviteId);

//     setInvites((prev) =>
//       prev.filter((i) => i.id !== inviteId)
//     );
//   }

//   useEffect(() => {
//     fetchInvites();
//   }, []);

//   return {
//     invites,
//     loading,
//     accept,
//     reject,
//     refresh: fetchInvites,
//   };
// }

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyInvites, acceptInvite, rejectInvite } from "../api/invites";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/invites/me returns objects shaped like:
//   { id, community: { id, slug, name, ... }, invitedUser, roleCode, status, ... }
// There is NO flat `communityId` field — accept/reject must use
// invite.community.id (or .slug) which we resolve internally here so
// callers only ever need the invite's own id.
// ─────────────────────────────────────────────────────────────────────────────

export function useInvites() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["invites", "me"],
    queryFn: async () => {
      const res = await getMyInvites();
      const data = res.data?.data;
      // Paginated envelope: { content: [...] }
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      return [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    },
    staleTime: 1000 * 60,
  });

  function resolveCommunityId(inviteId) {
    const invite = query.data?.find((i) => i.id === inviteId);
    return invite?.community?.slug ?? invite?.community?.id ?? null;
  }

  const acceptMutation = useMutation({
    mutationFn: async (inviteId) => {
      const communityId = resolveCommunityId(inviteId);
      if (!communityId)
        throw new Error("Cannot resolve community for this invite.");
      return acceptInvite(communityId, inviteId);
    },
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries({ queryKey: ["invites", "me"] });
      const previous = queryClient.getQueryData(["invites", "me"]);
      queryClient.setQueryData(["invites", "me"], (old) =>
        old ? old.filter((i) => i.id !== inviteId) : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(["invites", "me"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", "me"] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
    meta: { successMessage: "Invite accepted" },
  });

  const rejectMutation = useMutation({
    mutationFn: async (inviteId) => {
      const communityId = resolveCommunityId(inviteId);
      if (!communityId)
        throw new Error("Cannot resolve community for this invite.");
      return rejectInvite(communityId, inviteId);
    },
    onMutate: async (inviteId) => {
      await queryClient.cancelQueries({ queryKey: ["invites", "me"] });
      const previous = queryClient.getQueryData(["invites", "me"]);
      queryClient.setQueryData(["invites", "me"], (old) =>
        old ? old.filter((i) => i.id !== inviteId) : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(["invites", "me"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", "me"] });
    },
    meta: { successMessage: "Invite declined" },
  });

  return {
    invites: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    accept: (inviteId) => acceptMutation.mutateAsync(inviteId),
    reject: (inviteId) => rejectMutation.mutateAsync(inviteId),
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: ["invites", "me"] }),
  };
}
