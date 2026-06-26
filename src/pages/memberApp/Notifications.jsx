import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Mail } from "lucide-react";
import { useInvites } from "../../hooks/useInvites";
import { useNotifications } from "../../hooks/useNotifications";

const TABS = ["Payments", "Community", "Invites"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isPaymentNotification(n) {
  const type = (n.notificationType ?? "").toUpperCase();
  return type.includes("PAYMENT") || type.includes("OBLIGATION") || type.includes("AUTO_PAY");
}

function Avatar({ name }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "#1C2B8A22",
        border: "1px solid #1C2B8A44",
        color: "#1C2B8A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function EmptyState({ icon: Icon, label, hint, onAction, actionLabel }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        textAlign: "center",
      }}
    >
      <Icon size={22} strokeWidth={1.6} style={{ color: "#bbb" }} />
      <p style={{ color: "#999", fontSize: 13, margin: 0 }}>{label}</p>
      {hint && (
        <p style={{ color: "#aaa", fontSize: 12, margin: 0, maxWidth: 240, lineHeight: 1.5 }}>{hint}</p>
      )}
      {onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 4,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1.5px solid #002FA7",
            background: "#fff",
            color: "#002FA7",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function NotificationRow({ n, onTap }) {
  const isRead = n.readFlag ?? false;
  return (
    <button
      onClick={() => !isRead && onTap(n.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        textAlign: "left",
        background: "#fff",
        border: "none",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: isRead ? "transparent" : "#002FA7",
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: isRead ? 500 : 700, color: "#111", margin: 0 }}>
          {n.title ?? n.subject ?? n.message ?? "Notification"}
        </p>
        {n.title && n.message && (
          <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>{n.message}</p>
        )}
        <p style={{ fontSize: 12, color: "#aaa", margin: "6px 0 0" }}>{timeAgo(n.createdAt)}</p>
      </div>
    </button>
  );
}

function InviteCard({ invite, onAccept, onReject, busy }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "16px",
        marginBottom: 12,
        border: "1px solid #EFEFEF",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <Avatar name={invite.community?.name} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>
            {invite.community?.name ?? "Community"}
          </p>
          <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>Invited you to join</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onAccept(invite)}
          disabled={busy}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 4,
            border: "none",
            background: "#002FA7",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Accept
        </button>
        <button
          onClick={() => onReject(invite)}
          disabled={busy}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 4,
            border: "1.5px solid #002FA7",
            background: "#fff",
            color: "#002FA7",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Invites");

  const { invites, isLoading: invitesLoading, accept, reject, isAccepting, isRejecting, refresh } = useInvites();
  const { notifications, isLoading: notifsLoading, markRead } = useNotifications();

  const { paymentNotifs, communityNotifs } = useMemo(() => {
    const payment = [];
    const community = [];
    for (const n of notifications) {
      (isPaymentNotification(n) ? payment : community).push(n);
    }
    return { paymentNotifs: payment, communityNotifs: community };
  }, [notifications]);

  async function handleAccept(invite) {
    await accept(invite.id);
  }
  async function handleReject(invite) {
    await reject(invite.id);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EBEBEB",
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 20px",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>
          Notifications
        </h1>
      </div>

      {/* Tab bar */}
      <div
        style={{
          margin: "0 16px 20px",
          background: "#fff",
          borderRadius: 12,
          padding: 4,
          display: "flex",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              background: activeTab === tab ? "#EBEBEB" : "transparent",
              color: activeTab === tab ? "#111" : "#888",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px" }}>
        {activeTab === "Invites" && (
          invitesLoading ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "24px 0" }}>Loading…</p>
          ) : invites.length === 0 ? (
            <EmptyState
              icon={Mail}
              label="No invitations yet"
              hint="Ask a community admin to send you an invite link, or have them add you directly by your email or phone number."
              onAction={refresh}
              actionLabel="Check Again"
            />
          ) : (
            invites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                onAccept={handleAccept}
                onReject={handleReject}
                busy={isAccepting || isRejecting}
              />
            ))
          )
        )}

        {activeTab === "Payments" && (
          notifsLoading ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "24px 0" }}>Loading…</p>
          ) : paymentNotifs.length === 0 ? (
            <EmptyState icon={Bell} label="No payment notifications." />
          ) : (
            paymentNotifs.map((n) => <NotificationRow key={n.id} n={n} onTap={markRead} />)
          )
        )}

        {activeTab === "Community" && (
          notifsLoading ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "24px 0" }}>Loading…</p>
          ) : communityNotifs.length === 0 ? (
            <EmptyState icon={Bell} label="No community notifications." />
          ) : (
            communityNotifs.map((n) => <NotificationRow key={n.id} n={n} onTap={markRead} />)
          )
        )}
      </div>
    </div>
  );
}
