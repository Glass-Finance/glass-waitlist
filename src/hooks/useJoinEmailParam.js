import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// useJoinEmailParam
//
// Sibling to useInviteToken/useJoinCommunityParam — this one is for
// CheckEmail.jsx's QR handoff (?email=, an organic "Join Community" pick
// with no personal invite at all, see ChoosePath.jsx). There's no backend
// endpoint to actually send a continuation link, so the QR is the only
// context this can carry — this just pre-fills StepContact's email field
// with whatever the person already typed on desktop, instead of dropping
// them on a blank form. Not a credential like the other two params, so no
// sessionStorage persistence: it only needs to survive the one render
// where StepContact reads its initial value.
// ---------------------------------------------------------------------------
export function useJoinEmailParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const didStrip = useRef(false);
  const email = searchParams.get("email") ?? "";

  useEffect(() => {
    if (didStrip.current) return;
    didStrip.current = true;

    if (email) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("email");
          return next;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return email;
}
