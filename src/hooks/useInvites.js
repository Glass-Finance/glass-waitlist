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
import { getMyInvites, acceptInvite, rejectInvite, getMyCommunityJoinRequests } from "../api/invites";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/communities/invites/me returns objects shaped like:
//   { id, community: { id, slug, name, ... }, invitedUser, roleCode, status, ... }
// accept/reject are unscoped (PATCH /communities/invites/{inviteId}/accept|reject)
// — they act on the authenticated user's own invite, no community id needed.
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

  const acceptMutation = useMutation({
    mutationFn: (inviteId) => acceptInvite(inviteId),
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
    mutationFn: (inviteId) => rejectInvite(inviteId),
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

// Join requests the member submitted themselves (via a community's generic
// shareable link, see useJoinCommunityParam) — read-only here, no
// accept/reject, since they're the one waiting on the *admin* to act, not
// the other way around like a personalized invite. Untested against the
// live backend yet — /communities/join-requests/me is the endpoint that
// matches every other "my X" endpoint's /communities/-prefixed convention
// (getMyCommunities, getMyInvites), but there's also an unprefixed
// /join-requests/me defined in api/invites.js; swap here first if this
// turns out to be the wrong one.
export function useMyJoinRequests() {
  const query = useQuery({
    queryKey: ["join-requests", "me"],
    queryFn: async () => {
      const res = await getMyCommunityJoinRequests();
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      return list;
    },
    staleTime: 1000 * 60,
  });

  return {
    joinRequests: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
