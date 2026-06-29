import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// useJoinCommunityParam
//
// Sibling to useInviteToken — that hook is for a *personalized* invite
// (?token=, tied to one specific person, consumed via inviteToken on
// register). This one is for the community's own generic, shareable
// "Invite Link" (?community=<slug>, the same URL for everyone) shown in
// MemberAccess settings and the onboarding AddMembers page. Joining via
// this link has no personal token to send at registration, so it goes
// through POST /communities/{id}/join-requests after auth instead —
// same persistence pattern (sessionStorage, survives the OTP step) so it's
// not lost between Join's multi-step flow.
// ---------------------------------------------------------------------------
export const JOIN_COMMUNITY_KEY = "glass_join_community";

export function useJoinCommunityParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const didPersist = useRef(false);

  useEffect(() => {
    if (didPersist.current) return;
    didPersist.current = true;

    const community = searchParams.get("community");
    if (community) {
      sessionStorage.setItem(JOIN_COMMUNITY_KEY, community);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("community");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const community = sessionStorage.getItem(JOIN_COMMUNITY_KEY);

  function consumeCommunity() {
    sessionStorage.removeItem(JOIN_COMMUNITY_KEY);
  }

  return { community, consumeCommunity, hasCommunity: community !== null };
}
