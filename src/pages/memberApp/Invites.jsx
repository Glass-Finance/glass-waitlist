import { useInvites, useMyJoinRequests, useRevokeMyJoinRequest } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, Clock, Home, Info, Undo2, XCircle } from "lucide-react";
import { getInvite } from "../../api/invites";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";
import PageLoadingState from "../../components/common/PageLoadingState";
import { PENDING_INVITE_KEY } from "../InviteLanding";
import { Button } from "../../components/ui/Button";
import { isKycRequiredError, KYC_ACCEPT_BLOCK_COPY } from "../../utils/kycStatus";
import { getErrorMessage } from "../../utils/errorHandler";
// Same empty-state illustration the Notifications page's Invites tab uses.
import invitesEmptyIllustration from "../../assets/memberApp/empty-states/notifications-invites-empty.webp";

// CommunityJoinRequestStatus has four members; the copy is per-status because
// "Your request to join is pending" was previously hardcoded for all of them.
const JOIN_REQUEST_STATUS = {
  PENDING: {
    label: "Pending",
    subtitle: () => "Waiting for the community to approve your request",
    badge: "text-warning bg-[#FEF3C7]",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    subtitle: (name) => `You're now a member of ${name ?? "this community"}`,
    badge: "text-success-deep bg-success-tint",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Declined",
    subtitle: () => "The community declined your request",
    badge: "text-danger bg-danger-tint",
    icon: XCircle,
  },
  REVOKED: {
    label: "Withdrawn",
    subtitle: () => "You withdrew this request",
    badge: "text-ink-ghost bg-surface-sunken",
    icon: Undo2,
  },
};

function Avatar({ name, logo }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className={`w-10 h-10 rounded-[10px] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0 overflow-hidden ${logo?.url ? "bg-transparent" : "bg-brand-deep"}`}
    >
      {logo?.url ? (
        <img
          src={logo.url}
          alt=""
          decoding="async"
          className="w-full h-full object-cover"
          loading="lazy"
        />
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
  const { revokeJoinRequest, isRevoking } = useRevokeMyJoinRequest();
  // Two-step confirm inline on the row: withdrawing is one-way, and this page
  // already puts a bare Decline button per card, so a destructive tap deserves
  // a second beat rather than a modal this page has no precedent for.
  const [confirmingWithdrawId, setConfirmingWithdrawId] = useState(null);

  // A "Review Invite" email link lands on /invite?inviteId=... which stashes
  // the id here before redirecting to this (unfiltered) list — resolve it
  // once so we can highlight/scroll to that specific invite, or tell the
  // user it's no longer pending instead of leaving them to guess why it's
  // not obviously there.
  const [highlightId, setHighlightId] = useState(null);
  const [staleNotice, setStaleNotice] = useState(null);
  // Accept rejections (reactive KYC block, network, …) — inline above the
  // list so the reason lands on the invite the user just tapped.
  const [acceptNotice, setAcceptNotice] = useState(null);
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
        setStaleNotice(
          "That invite is no longer available — it may have expired or already been handled.",
        );
      });
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    cardRefs.current[highlightId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, invites]);

  async function handleAccept(invite) {
    setAcceptNotice(null);
    try {
      await accept(invite.id);
      navigate("/member/home");
    } catch (err) {
      // Backend-enforced staff gate: accepting an invite that grants a
      // staff role requires APPROVED KYC (CommunityInviteServiceImpl →
      // requireKycForCommunityRole). Show the shared copy instead of a
      // dead-end toast; the optimistic list removal already rolled back.
      setAcceptNotice(
        isKycRequiredError(err)
          ? KYC_ACCEPT_BLOCK_COPY
          : getErrorMessage(err, "Couldn't accept this invite."),
      );
    }
  }

  async function handleReject(invite) {
    await reject(invite.id);
  }

  async function handleWithdraw(req) {
    try {
      // req.community.id is the identifier the revoke route needs (same value
      // the list was fetched under); fall back to the id in the URL path only
      // if the payload omitted it.
      const communityId = req.community?.id ?? req.communityId;
      await revokeJoinRequest(communityId, req.id);
    } finally {
      setConfirmingWithdrawId(null);
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen pb-10">
      <GlassLogoGlow />
      {/* Header */}
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate("/member/home")}
          aria-label="Go back"
          className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-ink" />
        </button>
        <h1 className="text-[17px] font-semibold text-ink m-0">Invitations</h1>
      </div>

      <div className="px-4">
        {staleNotice && (
          <div className="flex items-center gap-2 bg-[#FEF3C7] text-warning text-[12.5px] font-medium py-2.5 px-3 rounded-[10px] mb-3">
            <Info size={14} strokeWidth={2} className="flex-shrink-0" />
            {staleNotice}
          </div>
        )}
        {acceptNotice && (
          <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#B91C1C] text-[12.5px] font-medium py-2.5 px-3 rounded-[10px] mb-3">
            <Info size={14} strokeWidth={2} className="flex-shrink-0" />
            {acceptNotice}
          </div>
        )}
        {isLoading || joinRequestsLoading ? (
          <PageLoadingState size={56} padding="36px 24px" />
        ) : error ? (
          <p className="text-[13px] text-danger py-6 px-1">
            Couldn't load invitations. Try again later.
          </p>
        ) : invites.length === 0 && joinRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-[60px] px-5 text-center">
            <img
              src={invitesEmptyIllustration}
              alt=""
              className="w-20 h-20 object-contain"
              draggable={false}
            />
            <p className="text-sm font-semibold text-ink m-0">No invitations yet</p>
            <p className="text-[13px] text-ink-ghost m-0 max-w-[260px] leading-[1.5]">
              If your admin has already added you, you're good to go — head to your home screen.
            </p>
            <Button
              onClick={() => navigate("/member/home", { replace: true })}
              fullWidth={false}
              className="mt-1.5 flex items-center gap-1.5 px-5"
            >
              <Home size={14} />
              Go to Home
            </Button>
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
                className={`border border-surface-container-border bg-white rounded-2xl p-3.5 mb-3 transition-shadow duration-300 ease-in-out ${invite.id === highlightId ? "shadow-[0_0_0_2pxvar(--color-brand)]" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3.5">
                  <Avatar name={invite.community?.name} logo={invite.community?.logo} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                      {invite.community?.name ?? "Community"}
                    </p>
                    <p className="text-xs text-ink-ghost mt-0.5 mx-0 mb-0">Invited you to join</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(invite)}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 py-2.5 px-0 rounded-lg border-[1.5px] border-surface-container-border bg-white text-ink-strong text-[13px] font-semibold cursor-pointer"
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
                generic shareable link. These aren't all pending — the admin
                may have approved or rejected them since, so the real status
                drives the copy (it used to hardcode "pending", which left an
                approved request looking ignored and hid the review comment on
                a rejection). */}
            {joinRequests.map((req) => {
              const meta = JOIN_REQUEST_STATUS[req.status] ?? JOIN_REQUEST_STATUS.PENDING;
              const StatusIcon = meta.icon;
              const confirmingWithdraw = confirmingWithdrawId === req.id;

              return (
                <div
                  key={req.id}
                  className="border border-surface-container-border bg-white rounded-2xl p-3.5 mb-3 flex items-center gap-3"
                >
                  <Avatar name={req.community?.name} logo={req.community?.logo} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                      {req.community?.name ?? "Community"}
                    </p>
                    <p className="text-xs text-ink-ghost mt-0.5 mx-0 mb-0">
                      {meta.subtitle(req.community?.name)}
                    </p>
                    {req.reviewComment && (
                      <p className="text-xs text-ink m-0 mt-1.5 mb-0">
                        <span className="font-semibold">Note from the community: </span>
                        {req.reviewComment}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-semibold ${meta.badge} py-[5px] px-2.5 rounded-full flex-shrink-0 self-start`}
                  >
                    <StatusIcon size={11} strokeWidth={2} />
                    {meta.label}
                  </span>

                  {req.status === "PENDING" && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {confirmingWithdraw ? (
                        <>
                          <button
                            onClick={() => handleWithdraw(req)}
                            disabled={isRevoking}
                            className="text-[13px] font-semibold text-white bg-danger-bright border-none rounded-lg px-3 py-2 cursor-pointer disabled:opacity-60"
                          >
                            {isRevoking ? "Withdrawing…" : "Yes, withdraw"}
                          </button>
                          <button
                            onClick={() => setConfirmingWithdrawId(null)}
                            disabled={isRevoking}
                            className="text-[13px] font-semibold text-ink-strong bg-white border-[1.5px] border-surface-container-border rounded-lg px-3 py-2 cursor-pointer disabled:opacity-60"
                          >
                            Keep it
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmingWithdrawId(req.id)}
                          className="text-[13px] font-semibold text-ink-strong bg-white border-[1.5px] border-surface-container-border rounded-lg px-3 py-2 cursor-pointer"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
