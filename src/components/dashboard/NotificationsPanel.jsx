import { useNavigate } from "react-router-dom";
import { Bell, AlertCircle, CreditCard, Users } from "lucide-react";
import { extractNotificationDetails, formatNairaAmount } from "../../utils/notificationContent";

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true });
  if (d.toDateString() === now.toDateString()) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) + `, ${time}`;
}

function dayLabel(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });
}

// Resolve community info if the backend ever starts returning it
function resolveCommunity(n, communityMap) {
  if (n.community) return n.community;
  const id = n.communityId ?? n.community_id ?? null;
  return (id && communityMap) ? (communityMap.get(id) ?? null) : null;
}

function notifMeta(n) {
  const t = (n.notificationType ?? n.type ?? "").toUpperCase();
  if (t.includes("FAIL") || t.includes("URGENT") || t.includes("ALERT") || t.includes("OVERDUE") || t.includes("DEFAULT"))
    return { color: "#EF4444", bg: "#FEF2F2", Icon: AlertCircle };
  if (t.includes("MEMBER") || t.includes("JOIN") || t.includes("COMMUNITY") || t.includes("INVITE"))
    return { color: "#002FA7", bg: "#EEF2FF", Icon: Users };
  return { color: "#CA8A04", bg: "#FFFBEB", Icon: CreditCard };
}

// Shows community logo when available; falls back to a type-coloured icon circle
function NotifAvatar({ n, community }) {
  const logo = community?.logo?.url ?? community?.logoUrl ?? null;
  const name = community?.name ?? "";
  if (logo) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", marginTop: 1 }}>
        <img src={logo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const { color, bg, Icon } = notifMeta(n);
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0, marginTop: 1,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={16} color={color} strokeWidth={2} />
    </div>
  );
}

function NotifCard({ n, communityMap, onMarkRead, onNavigate }) {
  const isRead    = n.readFlag ?? n.isRead ?? false;
  const title     = n.title ?? n.subject ?? "Notification";
  const body      = n.description ?? n.message ?? n.body ?? null;
  const time      = formatTimestamp(n.createdAt ?? n.timestamp);
  const community = resolveCommunity(n, communityMap);
  const commName  = community?.name ?? community?.communityName ?? n.communityName ?? null;
  const { color: borderColor } = notifMeta(n);

  return (
    <button
      onClick={() => {
        if (!isRead) onMarkRead?.(n.id);
        // Opens this notification's detail view on the notifications page —
        // the ?open= param is consumed there (see useNotificationDetail).
        onNavigate?.(`/dashboard/notifications?open=${n.id}`);
      }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
        background: isRead ? "#F9F9F9" : "#ffffff",
        borderRadius: 10, padding: "11px 13px",
        border: "none", borderLeft: `3px solid ${borderColor}`,
        cursor: "pointer", textAlign: "left",
        transition: "background 0.15s", outline: "none",
      }}
    >
      <NotifAvatar n={n} community={community} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {commName && (
          <p style={{
            fontSize: 10, fontWeight: 600, color: "#002FA7",
            margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {commName}
          </p>
        )}
        <p style={{
          fontSize: 13, fontWeight: isRead ? 500 : 600,
          color: isRead ? "#666" : "#111",
          margin: 0, lineHeight: 1.35,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </p>
        {body && (
          <p style={{
            fontSize: 11.5, color: "#888", margin: "3px 0 0", lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {body}
          </p>
        )}
        <p style={{ fontSize: 10.5, color: "#aaa", margin: "5px 0 0" }}>
          {time}
          {(() => {
            const amount = formatNairaAmount(extractNotificationDetails(n).amount);
            return amount ? (
              <span style={{ color: "#111", fontWeight: 600 }}> · {amount}</span>
            ) : null;
          })()}
        </p>
      </div>

      {!isRead && (
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#002FA7", flexShrink: 0, marginTop: 4 }} />
      )}
    </button>
  );
}

// Group items into day buckets, preserving already-sorted order
function groupByDay(items) {
  const buckets = [];
  let currentLabel = null;
  for (const n of items) {
    const label = dayLabel(n.createdAt);
    if (label !== currentLabel) {
      buckets.push({ label, items: [] });
      currentLabel = label;
    }
    buckets[buckets.length - 1].items.push(n);
  }
  return buckets;
}

export default function NotificationsPanel({
  notifications,
  isLoading,
  unreadCount,
  communityMap,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  const navigate = useNavigate();
  const count = unreadCount ?? notifications.filter((n) => !(n.readFlag ?? n.isRead)).length;
  const buckets = groupByDay(notifications);

  return (
    <div
      style={{
        position: "absolute", right: 0, top: "calc(100% + 10px)",
        width: 390, maxWidth: "calc(100vw - 16px)", background: "#F2F2F2",
        borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        zIndex: 50, overflow: "hidden",
      }}
      role="menu"
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>
          Notifications
          {count > 0 && (
            <span style={{ marginLeft: 7, fontSize: 13, fontWeight: 600, color: "#555" }}>
              {count}
            </span>
          )}
        </p>
        <button
          onClick={onMarkAllRead}
          style={{ fontSize: 12, fontWeight: 600, color: "#002FA7", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Mark all read
        </button>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 440, overflowY: "auto", paddingBottom: 6 }}>
        {isLoading ? (
          <p style={{ textAlign: "center", fontSize: 12, color: "#999", padding: "32px 0" }}>Loading…</p>
        ) : notifications.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 0" }}>
            <Bell size={22} style={{ color: "#ccc" }} />
            <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>No notifications yet.</p>
          </div>
        ) : (
          buckets.map(({ label, items }) => (
            <div key={label}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: "#999",
                letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "10px 16px 5px", margin: 0,
              }}>
                {label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 10px" }}>
                {items.map((n) => (
                  <NotifCard
                    key={n.id}
                    n={n}
                    communityMap={communityMap}
                    onMarkRead={onMarkRead}
                    onNavigate={(to) => { onClose?.(); navigate(to); }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <button
        onClick={() => { onClose?.(); navigate("/dashboard/notifications"); }}
        style={{
          display: "block", width: "100%", textAlign: "center",
          fontSize: 12, fontWeight: 600, color: "#002FA7",
          background: "#EBEBEB", border: "none",
          borderTop: "1px solid #E5E5E5", cursor: "pointer", padding: "10px 0",
        }}
      >
        View all notifications
      </button>
    </div>
  );
}
