import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

// ── Timestamp: "Today 9:00 AM" / "Yesterday 3:30 PM" / "Mar 12, 9:00 AM"
function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const time = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true });

  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === todayStr) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) + `, ${time}`;
}

// Notifications whose type signals urgency get the red left-border section
const URGENT_TYPES = ["FAILED", "DEFAULTER", "OVERDUE", "ATTENTION", "URGENT", "ERROR", "ALERT"];

function isUrgent(n) {
  const t = (n.notificationType ?? n.type ?? "").toUpperCase();
  return URGENT_TYPES.some((k) => t.includes(k));
}

// ── Single notification card ──────────────────────────────────────────────────
function NotifCard({ n, accentColor, onMarkRead }) {
  const isRead = n.readFlag ?? n.isRead ?? n.read ?? false;
  const title = n.title ?? n.subject ?? "Notification";
  const body  = n.message ?? n.body ?? null;
  const time  = formatTimestamp(n.createdAt ?? n.timestamp);

  return (
    <button
      onClick={() => !isRead && onMarkRead?.(n.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        background: "#ffffff",
        borderRadius: 10,
        padding: "12px 14px",
        border: "none",
        borderLeft: `3px solid ${accentColor}`,
        cursor: "pointer",
        textAlign: "left",
        opacity: isRead ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#D9D9D9",
          flexShrink: 0,
          marginTop: 1,
        }}
      />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: isRead ? 500 : 600,
            color: "#111",
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          {title}
        </p>
        {body && (
          <p
            style={{
              fontSize: 12,
              color: "#666",
              margin: "3px 0 0",
              lineHeight: 1.4,
            }}
          >
            {body}
          </p>
        )}
        <p
          style={{
            fontSize: 11,
            color: "#999",
            margin: "5px 0 0",
          }}
        >
          {time}
        </p>
      </div>
    </button>
  );
}

// ── Section with a label + list of cards ─────────────────────────────────────
function Section({ label, items, accentColor, onMarkRead }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#999",
          letterSpacing: "0.03em",
          padding: "10px 14px 6px",
          margin: 0,
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 10px" }}>
        {items.map((n) => (
          <NotifCard
            key={n.id}
            n={n}
            accentColor={accentColor}
            onMarkRead={onMarkRead}
          />
        ))}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function NotificationsPanel({
  notifications,
  isLoading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  const navigate = useNavigate();

  const urgent  = notifications.filter((n) => isUrgent(n));
  const activity = notifications.filter((n) => !isUrgent(n));

  const count = unreadCount ?? notifications.filter((n) => !(n.readFlag ?? n.isRead ?? n.read)).length;

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 10px)",
        width: 380,
        background: "#F2F2F2",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        zIndex: 50,
        overflow: "hidden",
      }}
      role="menu"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 10px",
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>
          Notifications{count > 0 && (
            <span
              style={{
                marginLeft: 7,
                fontSize: 13,
                fontWeight: 600,
                color: "#555",
              }}
            >
              {count}
            </span>
          )}
        </p>
        <button
          onClick={onMarkAllRead}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#002FA7",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Mark all read
        </button>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 420, overflowY: "auto", paddingBottom: 6 }}>
        {isLoading ? (
          <p style={{ textAlign: "center", fontSize: 12, color: "#999", padding: "32px 0" }}>
            Loading…
          </p>
        ) : notifications.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 0" }}>
            <Bell size={22} style={{ color: "#ccc" }} />
            <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>No notifications yet.</p>
          </div>
        ) : (
          <>
            <Section
              label="Urgent"
              items={urgent}
              accentColor="#EF4444"
              onMarkRead={onMarkRead}
            />
            <Section
              label="Payment Activity"
              items={activity}
              accentColor="#CA8A04"
              onMarkRead={onMarkRead}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <button
        onClick={() => { onClose?.(); navigate("/dashboard/notifications"); }}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          fontSize: 12,
          fontWeight: 600,
          color: "#002FA7",
          background: "#EBEBEB",
          border: "none",
          borderTop: "1px solid #E5E5E5",
          cursor: "pointer",
          padding: "10px 0",
        }}
      >
        View all notifications
      </button>
    </div>
  );
}
