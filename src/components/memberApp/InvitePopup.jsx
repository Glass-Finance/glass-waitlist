import { useState, useEffect } from "react";
import { useInvites } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "glass_popup_dismissed_invites";

function getDismissedIds() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function addDismissedIds(ids) {
  const existing = getDismissedIds();
  for (const id of ids) existing.add(id);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...existing]));
}

function CommunityAvatar({ name, logo }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className={`w-[72px] h-[72px] rounded-[18px] text-white flex items-center justify-center text-2xl font-bold overflow-hidden mx-auto mt-0 mb-5 ${logo?.url ? "bg-transparent" : "bg-[#1C2B8A]"}`}
    >
      {logo?.url ? (
        <img
          src={logo.url}
          alt=""
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function InvitePopup() {
  const { invites, isLoading, accept, reject, isAccepting, isRejecting } = useInvites();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  const pendingInvites = (invites ?? []).filter(
    (i) => (i.status ?? "").toUpperCase() === "PENDING",
  );
  const unseenInvites = pendingInvites.filter(
    (i) => !getDismissedIds().has(String(i.id)),
  );

  useEffect(() => {
    if (!isLoading && unseenInvites.length > 0) setVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, unseenInvites.length]);

  if (!visible || unseenInvites.length === 0) return null;

  const invite = unseenInvites[0];
  const remaining = unseenInvites.length;
  const isBusy = isAccepting || isRejecting;

  function handleLater() {
    addDismissedIds(unseenInvites.map((i) => String(i.id)));
    setVisible(false);
  }

  async function handleAccept() {
    await accept(invite.id);
    if (unseenInvites.length <= 1) setVisible(false);
    navigate("/member/home");
  }

  async function handleDecline() {
    await reject(invite.id);
    if (unseenInvites.length <= 1) setVisible(false);
  }

  return (
    /* Full-screen backdrop */
    <div className="fixed inset-0 bg-black/55 z-[200] flex items-center justify-center py-0 px-6">
      {/* Modal card */}
      <div className="w-full max-w-[360px] bg-surface-bg rounded-2xl pt-9 px-6 pb-7 text-center">
        {/* Community avatar */}
        <CommunityAvatar
          name={invite.community?.name}
          logo={invite.community?.logo}
        />

        {/* Heading */}
        <p className="text-lg font-bold text-[#111] mt-0 mx-0 mb-2 leading-[1.3]">
          You've Been Invited To Join
        </p>

        {/* Community name */}
        <p className="text-base font-bold text-[#1C2B8A] mt-0 mx-0 mb-2">
          {invite.community?.name ?? "a Community"}
        </p>

        {/* Subtitle */}
        <p className="text-[13px] text-[#888] mt-0 mx-0 mb-8 leading-[1.5]">
          Accept the invite to start tracking your dues and payments.
        </p>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          disabled={isBusy}
          className={`block w-full py-[15px] px-0 rounded-[10px] border-none bg-brand text-white text-[15px] font-semibold mb-3.5 ${isBusy ? "cursor-not-allowed opacity-70" : "cursor-pointer opacity-100"}`}
        >
          {isAccepting ? "Accepting…" : "Accept Invite"}
        </button>

        {/* Decline link */}
        <button
          onClick={handleDecline}
          disabled={isBusy}
          className={`block w-full bg-transparent border-none text-brand text-sm font-semibold ${isBusy ? "cursor-not-allowed" : "cursor-pointer"} ${remaining > 1 ? "mb-2.5" : "mb-0"}`}
        >
          Decline Invite
        </button>

        {/* Multiple invites — view all */}
        {remaining > 1 && (
          <button
            onClick={() => { handleLater(); navigate("/member/notifications"); }}
            className="block w-full bg-transparent border-none text-[#999] text-xs cursor-pointer pt-1"
          >
            +{remaining - 1} more invite{remaining - 1 > 1 ? "s" : ""} · View all
          </button>
        )}
      </div>
    </div>
  );
}
