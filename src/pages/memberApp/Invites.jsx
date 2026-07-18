import { useInvites, useMyJoinRequests } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Mail, Clock, Home, Info } from "lucide-react";
import { useCommunities } from "../../hooks/useCommunities";
import { getInvite } from "../../api/invites";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import PageLoadingState from "../../components/common/PageLoadingState";
import { PENDING_INVITE_KEY } from "../InviteLanding";

function Avatar({ name, logo }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className={`w-10 h-10 rounded-[10px] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0 overflow-hidden ${logo?.url ? "bg-transparent" : "bg-[#1C2B8A]"}`}
    >
      {logo?.url ? (
        <img src={logo.url} alt="" decoding="async" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export default function Invites() {
  const navigate = useNavigate();
  const { invites, isLoading, error, accept, reject, isAccepting, isRejecting, refresh } =
    useInvites();
  const { joinRequests, isLoading: joinRequestsLoading } = useMyJoinRequests();
  const { data: communitiesData } = useCommunities();

  const isEmpty = !isLoading && !joinRequestsLoading && invites.length === 0 && joinRequests.length === 0;
  const isAlreadyMember = (communitiesData?.communities?.length ?? 0) > 0;

  // A "Review Invite" email link lands on /invite?inviteId=... which stashes
  // the id here before redirecting to this (unfiltered) list — resolve it
  // once so we can highlight/scroll to that specific invite, or tell the
  // user it's no longer pending instead of leaving them to guess why it's
  // not obviously there.
  const [highlightId, setHighlightId] = useState(null);
  const [staleNotice, setStaleNotice] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    const pendingId = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (!pendingId) return;
    sessionStorage.removeItem(PENDING_INVITE_KEY);

    getInvite(pendingId)
      .then((res) => {
        const invite = res.data?.data ?? res.data;
        if (invite?.status === "PENDING") {
          setHighlightId(pendingId);
        } else {
          setStaleNotice("That invite has already been responded to.");
        }
      })
      .catch(() => {
        setStaleNotice("That invite is no longer available — it may have expired or already been handled.");
      });
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    cardRefs.current[highlightId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, invites]);

  // Member was added directly by an admin (no pending invite needed) — send
  // them straight to home instead of leaving them on an empty invite page.
  useEffect(() => {
    if (isEmpty && isAlreadyMember) {
      navigate("/member/home", { replace: true });
    }
  }, [isEmpty, isAlreadyMember, navigate]);

  async function handleAccept(invite) {
    await accept(invite.id);
    navigate("/member/home");
  }

  async function handleReject(invite) {
    await reject(invite.id);
  }

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <GlassLogoGlow />
      {/* Header */}
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate("/member/home")}
          aria-label="Go back"
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#333]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#111] m-0">
          Invitations
        </h1>
      </div>

      <div className="px-4">
        {staleNotice && (
          <div className="flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] text-[12.5px] font-medium py-2.5 px-3 rounded-[10px] mb-3">
            <Info size={14} strokeWidth={2} className="flex-shrink-0" />
            {staleNotice}
          </div>
        )}
        {isLoading || joinRequestsLoading ? (
          <PageLoadingState label="Loading your invites…" size={56} padding="36px 24px" />
        ) : error ? (
          <p className="text-[13px] text-[#DC2626] py-6 px-1">
            Couldn't load invitations. Try again later.
          </p>
        ) : invites.length === 0 && joinRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-[60px] px-5 text-center">
            <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center">
              <Mail size={22} strokeWidth={1.6} className="text-[#999]" />
            </div>
            <p className="text-sm font-semibold text-[#333] m-0">
              No invitations yet
            </p>
            <p className="text-[13px] text-[#888] m-0 max-w-[260px] leading-[1.5]">
              If your admin has already added you, you're good to go — head to your home screen.
            </p>
            <button
              onClick={() => navigate("/member/home", { replace: true })}
              className="mt-1.5 flex items-center gap-1.5 py-2.5 px-5 rounded-lg border-none bg-brand text-white text-[13px] font-semibold cursor-pointer"
            >
              <Home size={14} />
              Go to Home
            </button>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="py-[9px] px-[18px] rounded-lg border-[1.5px] border-brand bg-white text-brand text-[13px] font-semibold cursor-pointer"
            >
              Check Again
            </button>
          </div>
        ) : (
          <>
            {invites.map((invite) => (
              <div
                key={invite.id}
                ref={(el) => (cardRefs.current[invite.id] = el)}
                className={`border border-surface-container-border bg-white rounded-2xl p-3.5 mb-3 transition-shadow duration-300 ease-in-out ${invite.id === highlightId ? "shadow-[0_0_0_2px_#002FA7,0_1px_6px_rgba(0,0,0,0.06)]" : "shadow-[0_1px_6px_rgba(0,0,0,0.06)]"}`}
              >
                <div className="flex items-center gap-3 mb-3.5">
                  <Avatar name={invite.community?.name} logo={invite.community?.logo} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111] m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                      {invite.community?.name ?? "Community"}
                    </p>
                    <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">
                      Invited you to join
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(invite)}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 py-2.5 px-0 rounded-lg border-[1.5px] border-surface-container-border bg-white text-[#555] text-[13px] font-semibold cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 py-2.5 px-0 rounded-lg border-none bg-brand text-white text-[13px] font-semibold cursor-pointer"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}

            {/* Join requests the member submitted themselves via a community's
                generic shareable link — read-only, since the admin is the one
                who needs to act, not the member. */}
            {joinRequests.map((req) => (
              <div
                key={req.id}
                className="border border-surface-container-border bg-white rounded-2xl p-3.5 mb-3 shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center gap-3"
              >
                <Avatar name={req.community?.name} logo={req.community?.logo} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#111] m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                    {req.community?.name ?? "Community"}
                  </p>
                  <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">
                    Your request to join is pending
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#B45309] bg-[#FEF3C7] py-[5px] px-2.5 rounded-full flex-shrink-0">
                  <Clock size={11} strokeWidth={2} />
                  Pending
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
