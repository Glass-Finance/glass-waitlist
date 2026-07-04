import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";
import { useInvites } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";

// Session-level dismissal: stores invite IDs the user clicked "Later" on.
// A brand-new invite (different ID) will still surface on next visit.
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
        width: 56,
        height: 56,
        borderRadius: 14,
        background: "#1C2B8A",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: 700,
        flexShrink: 0,
        overflow: "hidden",
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
  const { invites, isLoading, accept, reject, isAccepting, isRejecting } =
    useInvites();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  const pendingInvites = (invites ?? []).filter(
    (i) => (i.status ?? "").toUpperCase() === "PENDING",
  );

  // Subtract already-dismissed IDs to get ones the user hasn't seen yet
  const unseenInvites = pendingInvites.filter(
    (i) => !getDismissedIds().has(String(i.id)),
  );

  // Show popup once data arrives and there are unseen invites
  useEffect(() => {
    if (!isLoading && unseenInvites.length > 0) {
      setVisible(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, unseenInvites.length]);

  if (!visible || unseenInvites.length === 0) return null;

  // Show one invite at a time — always the first unseen one
  const invite = unseenInvites[0];
  const remaining = unseenInvites.length;

  function handleLater() {
    // Mark ALL currently unseen invites as dismissed for this session
    addDismissedIds(unseenInvites.map((i) => String(i.id)));
    setVisible(false);
  }

  async function handleAccept() {
    await accept(invite.id);
    // If more unseen invites remain, they'll re-trigger the popup; otherwise close
    if (unseenInvites.length <= 1) setVisible(false);
    navigate("/member/home");
  }

  async function handleDecline() {
    await reject(invite.id);
    if (unseenInvites.length <= 1) setVisible(false);
  }

  const isBusy = isAccepting || isRejecting;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleLater}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 390,
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "0 20px 40px",
          zIndex: 201,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "14px 0 18px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "#E5E7EB",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111",
                margin: 0,
              }}
            >
              Community Invite
            </p>
            {remaining > 1 && (
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                {remaining} pending invites
              </p>
            )}
          </div>
          <button
            onClick={handleLater}
            aria-label="Dismiss"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#F3F4F6",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} style={{ color: "#555" }} />
          </button>
        </div>

        {/* Community card */}
        <div
          style={{
            background: "#F8F9FF",
            borderRadius: 16,
            padding: "16px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <CommunityAvatar
            name={invite.community?.name}
            logo={invite.community?.logo}
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {invite.community?.name ?? "Community"}
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: "3px 0 0" }}>
              Invited you to join
            </p>
            {invite.roleCode && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#1C2B8A",
                  background: "#E8ECF8",
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                {invite.roleCode}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button
            onClick={handleDecline}
            disabled={isBusy}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 10,
              border: "1.5px solid #E5E7EB",
              background: "#fff",
              color: "#555",
              fontSize: 14,
              fontWeight: 600,
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={isBusy}
            style={{
              flex: 2,
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background: "#002FA7",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.7 : 1,
            }}
          >
            {isAccepting ? "Accepting…" : "Accept Invite"}
          </button>
        </div>

        {/* View all link if multiple */}
        {remaining > 1 && (
          <button
            onClick={() => {
              handleLater();
              navigate("/member/notifications");
            }}
            style={{
              display: "block",
              width: "100%",
              background: "none",
              border: "none",
              color: "#002FA7",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            View all {remaining} invites →
          </button>
        )}

        {/* Later link */}
        <button
          onClick={handleLater}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            color: "#999",
            fontSize: 13,
            fontWeight: 400,
            cursor: "pointer",
            textAlign: "center",
            padding: "4px 0",
            marginTop: remaining > 1 ? 4 : 0,
          }}
        >
          Handle later
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to   { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
