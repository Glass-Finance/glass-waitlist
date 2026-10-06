import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyInvites,
  acceptInvite,
  rejectInvite,
  getMyCommunityJoinRequests,
  revokeMyJoinRequest,
} from "../api/invites";
import { normalizeImageObject } from "../utils/normalizeImageFields";

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
      // SECURITY: the invite's nested community logo is server-controlled and
      // bound to <img src> by Invites.jsx and InvitePopup's CommunityAvatar
      // (the latter reaches PulseImg). Normalize in the shared queryFn so both
      // consumers are covered by this one change.
      const normalized = list.map((i) =>
        i?.community?.logo
          ? { ...i, community: { ...i.community, logo: normalizeImageObject(i.community.logo) } }
          : i,
      );
      return [...normalized].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      if (ctx?.previous) queryClient.setQueryData(["invites", "me"], ctx.previous);
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
      if (ctx?.previous) queryClient.setQueryData(["invites", "me"], ctx.previous);
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
    refresh: () => queryClient.invalidateQueries({ queryKey: ["invites", "me"] }),
  };
}

// Join requests the member submitted themselves (via a community's generic
// shareable link, see useJoinCommunityParam). No accept/reject — they're the
// one waiting on the *admin* to act, not the other way around like a
// personalized invite — but a PENDING request can be withdrawn, because the
// backend allows exactly that (requester-only, PENDING-only).
//
// The endpoint ambiguity noted here before ("/communities/join-requests/me vs
// the unprefixed /join-requests/me") is settled: CI runs `audit:endpoints
// --strict`, so this /communities/-prefixed path is confirmed deployed.
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

/**
 * Withdraw one of the member's own PENDING join requests.
 *
 * Unlike accept/decline this does NOT optimistically drop the row: revoking
 * leaves the request in the list as REVOKED (the member may want to see that
 * it happened, and re-requesting later is a separate action), so a plain
 * invalidation is both simpler and more truthful than a rollback dance.
 */
export function useRevokeMyJoinRequest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ communityId, requestId }) => revokeMyJoinRequest(communityId, requestId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", "me"] });
    },
    meta: { successMessage: "Join request withdrawn" },
  });

  return {
    revokeJoinRequest: (communityId, requestId) => mutation.mutateAsync({ communityId, requestId }),
    isRevoking: mutation.isPending,
  };
}
