import { useMemo, useState } from "react";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Mail, User } from "lucide-react";
import { useInvites } from "../../hooks/useInvites";
import { useNotifications } from "../../hooks/useNotifications";
import { useCommunityMap } from "../../hooks/useCommunityMap";
import { notificationTarget } from "../../utils/notificationRouting";
import { isPaymentNotificationType, isSelfAccountType, notificationVisual } from "../../utils/notificationTypes";
import { extractNotificationDetails, formatNairaAmount } from "../../utils/notificationContent";
import { useAuth } from "../../store/AuthContext";
import PageLoadingState from "../../components/common/PageLoadingState";
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
// Per Figma: notifications use a category icon, not a photo/initials
// avatar — even a clearly-named event ("X joined Y") shows a status icon
// rather than that person's photo. A self-account event is the one
// exception, since it's genuinely about the reader's own account and
// there's a real photo to show. Every other type gets a purpose-built
// icon + semantic color for its category (see notificationVisual) — red
// for failures/urgent, amber for due-soon, green for success, indigo for
// new/info, gray for neutral account notices.
function NotifIcon({ n }) {
  const { user } = useAuth();
  const type = n.notificationType ?? "";
  const isSelf = isSelfAccountType(type);
  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  if (isSelf && user?.profileImage?.url) {
    return (
      <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
        <img src={user.profileImage.url} alt={selfName ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  const visual = notificationVisual(type);
  const Icon = visual?.icon ?? (isSelf ? User : Bell);
  const bg = visual?.bg ?? "#F3F4F6";
  const fg = visual?.fg ?? "#6B7280";

  return (
    <div
      style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Icon size={18} strokeWidth={2} color={fg} />
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────
// Per the design, only unread rows get a highlighted background — read rows
// sit flush against the shared list container behind them.
function NotificationRow({ n, onTap, onNavigate }) {
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
        padding: isRead ? "10px 4px" : "14px 16px",
        background: isRead ? "transparent" : "var(--color-stacked-container)",
        borderRadius: isRead ? 0 : 12,
        position: "relative",
        cursor: target ? "pointer" : "default",
      }}
      onClick={() => {
        if (!isRead) onTap(n.id);
        if (target) onNavigate?.(target);
      }}
    >
      {!isRead && (
        <span style={{ position: "absolute", top: 10, right: 12, width: 7, height: 7, borderRadius: "50%", background: "#002FA7" }} />
      )}
      <NotifIcon n={n} />
      <div style={{ flex: 1, minWidth: 0, paddingRight: isRead ? 0 : 14 }}>
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
      </div>
    </div>
  );
}

// ── Invite card ───────────────────────────────────────────────────────────────
function Avatar({ name, logo }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: logo?.url ? "transparent" : "#1C2B8A22", border: logo?.url ? "none" : "1px solid #1C2B8A44", color: "#1C2B8A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
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
    <div style={{ background: "#fff", borderRadius: 14, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", border: "1px solid #E0E0EB" }}>
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
// A single bordered card holds every day-group, per the design — not one
// card per day. Day labels are just section dividers inside it.
function GroupedNotifications({ items, onTap, onNavigate }) {
  const groups = useMemo(() => groupByDay(items), [items]);
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #E0E0EB",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {[...groups.entries()].map(([label, notifs]) => (
        <div key={label}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 8px" }}>{label}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {notifs.map((n) => (
              <NotificationRow key={n.id} n={n} onTap={onTap} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Payments");

  const { invites, isLoading: invitesLoading, accept, reject, isAccepting, isRejecting, refresh } = useInvites();
  const {
    notifications, isLoading: notifsLoading, markRead,
    markAllRead, isMarkingAllRead, clearAll, isClearing,
  } = useNotifications();

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
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh",  fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
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
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 12, padding: 4, display: "flex", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? "var(--color-stacked-container)" : "transparent",
              color: activeTab === tab ? "#111" : "#888", transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Clear All / Mark All As Read — same actions as the bell dropdown
          and admin notifications page, missing here before. Applies to the
          whole list regardless of which tab is active, matching how those
          two surfaces already behave. */}
      {(activeTab === "Payments" || activeTab === "Community") && notifications.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, padding: "0 20px 12px" }}>
          <button
            onClick={() => clearAll()}
            disabled={isClearing}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#E53E3E", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: isClearing ? 0.5 : 1 }}
          >
            {isClearing ? "Clearing…" : "Clear All"}
          </button>
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#002FA7", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: isMarkingAllRead ? 0.5 : 1 }}
          >
            Mark All As Read
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "0 16px" }}>
        {activeTab === "Payments" && (
          notifsLoading
            ? <PageLoadingState size={56} padding="36px 24px" />
            : paymentNotifs.length === 0
              ? <EmptyState icon={Bell} label="No payment notifications." />
              : <GroupedNotifications items={paymentNotifs} onTap={markRead} onNavigate={navigate} />
        )}

        {activeTab === "Community" && (
          notifsLoading
            ? <PageLoadingState size={56} padding="36px 24px" />
            : communityNotifs.length === 0
              ? <EmptyState icon={Bell} label="No community notifications." />
              : <GroupedNotifications items={communityNotifs} onTap={markRead} onNavigate={navigate} />
        )}

        {activeTab === "Invites" && (
          invitesLoading
            ? <PageLoadingState size={56} padding="36px 24px" />
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
