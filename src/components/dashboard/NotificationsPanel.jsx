import { useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { extractNotificationDetails, formatNairaAmount, resolveCommunity as resolveNotificationCommunity } from "../../utils/notificationContent";
import { isSelfAccountType, notificationVisual } from "../../utils/notificationTypes";
import { useAuth } from "../../store/AuthContext";
import LoadingState from "../common/LoadingState";
import EmptyState from "../common/EmptyState";
import { formatRelativeDateTime as formatTimestamp } from "../../utils/format";

function dayLabel(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays >= 0 && diffDays < 7) return "This Week";
  return d.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });
}

// Resolve community info for display AND for the owned/member routing
// split below — shares notificationContent.js's resolveCommunity (id
// lookup, falling back to matching the community's name against the
// notification's own text) instead of keeping a separate local copy that
// can drift out of sync with it, which is exactly what happened before:
// this file's version had a community_id fallback the shared one lacked.
function resolveCommunity(n, communityMap) {
  return resolveNotificationCommunity(n, communityMap) ?? n.community ?? null;
}

// Where clicking this notification should go — scoped to the community it
// actually came from (not whatever community happened to be active last),
// and to the right side of the app for this user's role there:
//   - a community this user OWNS/ADMINS  → the admin notifications page,
//     scoped via ?community=, opening this notification's detail view.
//   - a community this user is only a MEMBER of → the member app's
//     notifications page. That page is hard-gated to mobile (see
//     MemberDeviceGuard) same as the rest of the member app; on desktop the
//     guard itself redirects to the QR hand-off screen rather than a dead
//     end, the same fallback every other member-app deep link already
//     relies on — nothing special-cased here.
//   - no resolvable community (an account-level notification, or one whose
//     community isn't in this user's list at all) → the unscoped admin
//     notifications page, same as before.
function notifDestination(n, community) {
  if (community) {
    const ref = community.slug ?? community.id;
    return community.owned
      ? `/dashboard/notifications?community=${ref}&open=${n.id}`
      : `/member/notifications?community=${ref}`;
  }
  return `/dashboard/notifications?open=${n.id}`;
}

// Per Figma: notifications use a category icon, not a photo/initials
// avatar — even a clearly-named event ("X joined Y") shows a status icon
// rather than that person's photo. A self-account event is the one
// exception, since it's genuinely about the reader's own account and
// there's a real photo to show (from auth state directly). Every other
// type gets a purpose-built icon + semantic color for its category (see
// notificationVisual) — red for failures/urgent, amber for due-soon, green
// for success, indigo for new/info, gray for neutral account notices.
function NotifAvatar({ n }) {
  const type = n.notificationType ?? n.type;
  const { user } = useAuth();
  const isSelf = isSelfAccountType(type);
  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  if (isSelf && user?.profileImage?.url) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", marginTop: 1 }}>
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
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0, marginTop: 1,
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Icon size={17} strokeWidth={2} color={fg} />
    </div>
  );
}

function NotifCard({ n, communityMap, onMarkRead, onNavigate }) {
  const isRead    = n.readFlag ?? n.isRead ?? false;
  const title     = n.title ?? n.subject ?? "Notification";
  const body      = n.message ?? n.description ?? n.bodyText ?? n.body ?? null;
  const time      = formatTimestamp(n.createdAt ?? n.timestamp);
  const community = resolveCommunity(n, communityMap);
  const commName  = community?.name ?? community?.communityName ?? n.communityName ?? null;

  return (
    <button
      onClick={() => {
        if (!isRead) onMarkRead?.(n.id);
        onNavigate?.(notifDestination(n, community));
      }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
        background: isRead ? "#F9F9F9" : "#ffffff",
        borderRadius: 10, padding: "11px 13px",
        border: "none",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.15s", outline: "none",
      }}
    >
      <NotifAvatar n={n} />

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
  onClearAll,
  isClearing,
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onClearAll}
            disabled={isClearing || notifications.length === 0}
            style={{
              fontSize: 12, fontWeight: 600, color: "#E53E3E", background: "none",
              border: "none", cursor: "pointer", padding: 0,
              opacity: isClearing || notifications.length === 0 ? 0.4 : 1,
            }}
          >
            {isClearing ? "Clearing…" : "Clear All"}
          </button>
          <button
            onClick={onMarkAllRead}
            style={{ fontSize: 12, fontWeight: 600, color: "#002FA7", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Mark All As Read
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 440, overflowY: "auto", paddingBottom: 6 }}>
        {isLoading ? (
          <LoadingState className="py-8" />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" className="py-8" />
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
          background: "var(--color-stacked-container)", border: "none",
          borderTop: "1px solid #E5E5E5", cursor: "pointer", padding: "10px 0",
        }}
      >
        View all notifications
      </button>
    </div>
  );
}
