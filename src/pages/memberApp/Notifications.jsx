import { useMemo, useState } from "react";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Mail, MoreVertical, CreditCard, AlertCircle, Clock } from "lucide-react";
import { useInvites } from "../../hooks/useInvites";
import { useNotifications } from "../../hooks/useNotifications";
import { useCommunityMap } from "../../hooks/useCommunityMap";
import { notificationTarget } from "../../utils/notificationRouting";
import { isPaymentNotificationType, notificationCategory } from "../../utils/notificationTypes";
import { extractNotificationDetails, formatNairaAmount } from "../../utils/notificationContent";
import LoadingState from "../../components/common/LoadingState";
import { formatRelativeDateTime } from "../../utils/format";

const TABS = ["Payments", "Community", "Invites"];

// ── Date grouping helpers ─────────────────────────────────────────────────────
function dayLabel(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (target >= today) return "Today";
  if (target >= yesterday) return "Yesterday";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

function timeLabel(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByDay(items) {
  const groups = new Map();
  for (const item of items) {
    const label = dayLabel(item.createdAt ?? item.date ?? item.invitedAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(item);
  }
  return groups;
}

// isPaymentNotificationType checks against the backend's exact
// notificationType enum first; the substring fallback only covers
// legacy/unrecognized types.
function isPaymentNotification(n) {
  const type = n.notificationType ?? "";
  if (isPaymentNotificationType(type)) return true;
  const upper = type.toUpperCase();
  return upper.includes("PAYMENT") || upper.includes("OBLIGATION") || upper.includes("AUTO_PAY");
}

// ── Notification icon ─────────────────────────────────────────────────────────
function NotifIcon({ n }) {
  const type = n.notificationType ?? "";
  const cat = notificationCategory(type);
  let bg, Icon, iconColor;
  if (cat ? cat === "urgent" : /FAIL|ERROR|DECLINE/.test(type.toUpperCase())) {
    bg = "#fce4e4"; Icon = AlertCircle; iconColor = "#dc2626";
  } else if (cat === "payment" || (!cat && isPaymentNotification(n))) {
    bg = "#fef9c3"; Icon = CreditCard; iconColor = "#b45309";
  } else {
    bg = "#f0f4ff"; Icon = Clock; iconColor = "#1C2B8A";
  }
  return (
    <div style={{ width: 38, height: 38, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={16} strokeWidth={1.8} style={{ color: iconColor }} />
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotificationRow({ n, onTap, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isRead = n.readFlag ?? false;
  const target = notificationTarget(n, { memberApp: true });
  const communityMap = useCommunityMap();
  const details = extractNotificationDetails(n, { communityMap });
  const amount = formatNairaAmount(details.amount);
  const messageText = n.message ?? n.description ?? n.bodyText ?? null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "14px 16px",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        position: "relative",
      }}
    >
      <NotifIcon n={n} />
      <div
        style={{ flex: 1, minWidth: 0, cursor: target ? "pointer" : "default" }}
        onClick={() => {
          if (!isRead) onTap(n.id);
          if (target) onNavigate?.(target);
        }}
      >
        <p style={{ fontSize: 14, color: "#111", margin: 0, lineHeight: 1.45 }}>
          {n.title && <span style={{ fontWeight: isRead ? 500 : 700 }}>{n.title} </span>}
          {messageText && <span style={{ color: "#444" }}>{messageText}</span>}
          {!n.title && !messageText && <span style={{ fontWeight: 500 }}>Notification</span>}
        </p>
        <p style={{ fontSize: 11.5, color: "#999", margin: "4px 0 0" }}>
          {amount && (
            <span style={{ color: "#111", fontWeight: 600 }}>{amount} · </span>
          )}
          {[details.communityName, timeLabel(n.createdAt)].filter(Boolean).join(" · ")}
        </p>
        {!isRead && (
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#002FA7", display: "inline-block", marginTop: 5 }} />
        )}
      </div>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#999", display: "flex" }}
        >
          <MoreVertical size={16} strokeWidth={1.8} />
        </button>
        {menuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
            <div style={{ position: "absolute", right: 0, top: "100%", background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 20, minWidth: 140, overflow: "hidden" }}>
              {!isRead && (
                <button
                  onClick={() => { onTap(n.id); setMenuOpen(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: 13, cursor: "pointer", background: "#fff", border: "none", color: "#333" }}
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => setMenuOpen(false)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: 13, cursor: "pointer", background: "#fff", border: "none", color: "#333" }}
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Invite card ───────────────────────────────────────────────────────────────
function Avatar({ name, logo }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1C2B8A22", border: "1px solid #1C2B8A44", color: "#1C2B8A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
      {logo?.url
        ? <img src={logo.url} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

function InviteCard({ invite, onAccept, onReject, busy }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid var(--color-outline-on-surface)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <Avatar name={invite.community?.name} logo={invite.community?.logo} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{invite.community?.name ?? "Community"}</p>
            {invite.createdAt && (
              <span style={{ fontSize: 11, color: "#aaa", flexShrink: 0, whiteSpace: "nowrap" }}>
                {formatRelativeDateTime(invite.createdAt)}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>Invited you to join</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onAccept(invite)} disabled={busy}
          style={{ flex: 1, padding: "12px 0", borderRadius: 4, border: "none", background: "#002FA7", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Accept
        </button>
        <button onClick={() => onReject(invite)} disabled={busy}
          style={{ flex: 1, padding: "12px 0", borderRadius: 4, border: "1.5px solid #002FA7", background: "#fff", color: "#002FA7", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Decline
        </button>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, label, hint, onAction, actionLabel }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
      <Icon size={22} strokeWidth={1.6} style={{ color: "#bbb" }} />
      <p style={{ color: "#999", fontSize: 13, margin: 0 }}>{label}</p>
      {hint && <p style={{ color: "#aaa", fontSize: 12, margin: 0, maxWidth: 240, lineHeight: 1.5 }}>{hint}</p>}
      {onAction && (
        <button onClick={onAction}
          style={{ marginTop: 4, padding: "8px 16px", borderRadius: 8, border: "1.5px solid #002FA7", background: "#fff", color: "#002FA7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Grouped list ──────────────────────────────────────────────────────────────
function GroupedNotifications({ items, onTap, onNavigate }) {
  const groups = useMemo(() => groupByDay(items), [items]);
  return (
    <>
      {[...groups.entries()].map(([label, notifs]) => (
        <div key={label} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 8px" }}>{label}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifs.map((n) => (
              <NotificationRow key={n.id} n={n} onTap={onTap} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Payments");

  const { invites, isLoading: invitesLoading, accept, reject, isAccepting, isRejecting, refresh } = useInvites();
  const { notifications, isLoading: notifsLoading, markRead } = useNotifications();

  const { paymentNotifs, communityNotifs } = useMemo(() => {
    const payment = [], community = [];
    for (const n of notifications) {
      (isPaymentNotification(n) ? payment : community).push(n);
    }
    return { paymentNotifs: payment, communityNotifs: community };
  }, [notifications]);

  async function handleAccept(invite) { await accept(invite.id); }
  async function handleReject(invite) { await reject(invite.id); }

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", background: "var(--color-surface-bg)", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <GlassLogoGlow />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 20px", position: "relative" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ position: "absolute", left: 20, width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>Notifications</h1>
      </div>

      {/* Tab bar */}
      <div style={{ margin: "0 16px 20px", background: "#fff", borderRadius: 12, padding: 4, display: "flex", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
              background: activeTab === tab ? "var(--color-stacked-container)" : "transparent",
              color: activeTab === tab ? "#111" : "#888", transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px" }}>
        {activeTab === "Payments" && (
          notifsLoading
            ? <LoadingState className="py-6" />
            : paymentNotifs.length === 0
              ? <EmptyState icon={Bell} label="No payment notifications." />
              : <GroupedNotifications items={paymentNotifs} onTap={markRead} onNavigate={navigate} />
        )}

        {activeTab === "Community" && (
          notifsLoading
            ? <LoadingState className="py-6" />
            : communityNotifs.length === 0
              ? <EmptyState icon={Bell} label="No community notifications." />
              : <GroupedNotifications items={communityNotifs} onTap={markRead} onNavigate={navigate} />
        )}

        {activeTab === "Invites" && (
          invitesLoading
            ? <LoadingState className="py-6" />
            : invites.length === 0
              ? <EmptyState
                  icon={Mail}
                  label="No invitations yet"
                  hint="Ask a community admin to send you an invite link, or have them add you directly by your email."
                  onAction={refresh}
                  actionLabel="Check Again"
                />
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {invites.map((invite) => (
                    <InviteCard
                      key={invite.id}
                      invite={invite}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      busy={isAccepting || isRejecting}
                    />
                  ))}
                </div>
              )
        )}
      </div>
    </div>
  );
}
