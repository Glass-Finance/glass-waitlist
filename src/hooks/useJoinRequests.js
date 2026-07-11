import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCommunityJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "../api/communities";
import { parseUserData } from "../utils/userData";

function unwrap(res) {
  const d = res.data?.data;
  return Array.isArray(d) ? d : (d?.content ?? []);
}

// Names are stored in whatever case the user typed ("home alone") —
// capitalise for display.
function capitalizeName(s) {
  return (s ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
}

// The requester lives under `requestedUser` (confirmed against the live
// response) — the other containers are kept as fallbacks in case the shape
// shifts, including the userData JSON blob GET /user/me style profiles use.
// Shared by the Join Requests page and the Members-page summary banner.
export function requesterOf(r) {
  const u =
    r.requestedUser ?? r.user ?? r.member ?? r.requester ?? r.requestedBy ?? r;
  const ud = parseUserData(u);
  const firstName = capitalizeName(u.firstName ?? ud.firstName ?? "");
  const lastName = capitalizeName(u.lastName ?? ud.lastName ?? "");
  const email = u.email ?? r.email ?? r.userEmail ?? null;
  const phone = u.phoneNumber ?? ud.phone ?? r.phoneNumber ?? null;
  const image = ud.profileImage ?? u.profileImage?.url ?? u.avatarUrl ?? null;
  const name = `${firstName} ${lastName}`.trim() || email || "Unknown requester";
  const initials = (`${firstName.charAt(0)}${lastName.charAt(0)}` ||
    (email ?? "?").slice(0, 2)).toUpperCase();
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