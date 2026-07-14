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
      style={{
        width: 72,
        height: 72,
        borderRadius: 18,
        background: logo?.url ? "transparent" : "#1C2B8A",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 700,
        overflow: "hidden",
        margin: "0 auto 20px",
      }}
    >
      {logo?.url ? (
        <img
          src={logo.url}
          alt=""
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      {/* Modal card */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#F9F9FB",
          borderRadius: 20,
          padding: "36px 24px 28px",
          textAlign: "center",
        }}
      >
        {/* Community avatar */}
        <CommunityAvatar
          name={invite.community?.name}
          logo={invite.community?.logo}
        />

        {/* Heading */}
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#111",
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          You've Been Invited To Join
        </p>

        {/* Community name */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1C2B8A",
            margin: "0 0 8px",
          }}
        >
          {invite.community?.name ?? "a Community"}
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 13,
            color: "#888",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        >
          Accept the invite to start tracking your dues and payments.
        </p>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          disabled={isBusy}
          style={{
            display: "block",
            width: "100%",
            padding: "15px 0",
            borderRadius: 10,
            border: "none",
            background: "#002FA7",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: isBusy ? "not-allowed" : "pointer",
            opacity: isBusy ? 0.7 : 1,
            marginBottom: 14,
          }}
        >
          {isAccepting ? "Accepting…" : "Accept Invite"}
        </button>

        {/* Decline link */}
        <button
          onClick={handleDecline}
          disabled={isBusy}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            color: "#002FA7",
            fontSize: 14,
            fontWeight: 600,
            cursor: isBusy ? "not-allowed" : "pointer",
            marginBottom: remaining > 1 ? 10 : 0,
          }}
        >
          Decline Invite
        </button>

        {/* Multiple invites — view all */}
        {remaining > 1 && (
          <button
            onClick={() => { handleLater(); navigate("/member/notifications"); }}
            style={{
              display: "block",
              width: "100%",
              background: "none",
              border: "none",
              color: "#999",
              fontSize: 12,
              cursor: "pointer",
              paddingTop: 4,
            }}
          >
            +{remaining - 1} more invite{remaining - 1 > 1 ? "s" : ""} · View all
          </button>
        )}
      </div>
    </div>
  );
}
