import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "../api/communities";
import { parseUserData } from "../utils/userData";
import { normalizeImageUrl } from "../utils/normalizeImageFields";
import { toTitleCase } from "../utils/format";

function unwrap(res) {
  const d = res.data?.data;
  return Array.isArray(d) ? d : (d?.content ?? []);
}

// The requester lives under `requestedUser` (confirmed against the live
// response) — the other containers are kept as fallbacks in case the shape
// shifts, including the userData JSON blob GET /user/me style profiles use.
// Shared by the Join Requests page and the Members-page summary banner.
export function requesterOf(r) {
  const u = r.requestedUser ?? r.user ?? r.member ?? r.requester ?? r.requestedBy ?? r;
  const ud = parseUserData(u);
  const firstName = toTitleCase(u.firstName ?? ud.firstName ?? "");
  const lastName = toTitleCase(u.lastName ?? ud.lastName ?? "");
  const email = u.email ?? r.email ?? r.userEmail ?? null;
  const phone = u.phoneNumber ?? ud.phone ?? r.phoneNumber ?? null;
  // SECURITY: `image` is bound straight to <img src> by JoinRequests.jsx and is
  // server-controlled. Two shapes reach it here — `ud.profileImage` is a
  // `{ url }` object on the /user/me-derived payload, while `u.profileImage?.url`
  // and `u.avatarUrl` are plain strings — so both are reduced to a validated URL
  // string. Normalizing at this shared derivation covers every consumer of
  // requesterOf rather than validating at the JSX sink.
  const image = normalizeImageUrl(
    (typeof ud.profileImage === "object" ? ud.profileImage?.url : ud.profileImage) ??
      u.profileImage?.url ??
      u.avatarUrl,
  );
  const name = `${firstName} ${lastName}`.trim() || email || "Unknown requester";
  const initials = (
    `${firstName.charAt(0)}${lastName.charAt(0)}` || (email ?? "?").slice(0, 2)
  ).toUpperCase();
  return { name, email, phone, image, initials };
}

export function requestStatusOf(r) {
  return (r.status ?? "PENDING").toUpperCase();
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
