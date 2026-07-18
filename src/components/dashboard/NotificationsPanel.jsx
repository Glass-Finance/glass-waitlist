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
      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden mt-px">
        <img src={user.profileImage.url} alt={selfName ?? ""} className="w-full h-full object-cover" />
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
      className={`flex items-start gap-2.5 w-full rounded-[10px] py-2.5 px-3.5 border-none cursor-pointer text-left transition-[background] duration-150 outline-none ${isRead ? "bg-[#F9F9F9]" : "bg-white"}`}
    >
      <NotifAvatar n={n} />

      <div className="flex-1 min-w-0">
        {commName && (
          <p className="text-[10px] font-semibold text-brand mt-0 mx-0 mb-0.5 uppercase tracking-[0.04em] overflow-hidden text-ellipsis whitespace-nowrap">
            {commName}
          </p>
        )}
        <p className={`text-[13px] m-0 leading-[1.35] overflow-hidden text-ellipsis whitespace-nowrap ${isRead ? "font-medium text-[#666]" : "font-semibold text-[#111]"}`}>
          {title}
        </p>
        {body && (
          <p className="text-[11.5px] text-[#888] mt-[3px] mx-0 mb-0 leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">
            {body}
          </p>
        )}
        <p className="text-[10.5px] text-[#aaa] mt-[5px] mx-0 mb-0">
          {time}
          {(() => {
            const amount = formatNairaAmount(extractNotificationDetails(n).amount);
            return amount ? (
              <span className="text-[#111] font-semibold"> · {amount}</span>
            ) : null;
          })()}
        </p>
      </div>

      {!isRead && (
        <div className="w-[7px] h-[7px] rounded-full bg-brand flex-shrink-0 mt-1" />
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
      className="absolute right-0 w-[390px] bg-[#F2F2F2] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] z-50 overflow-hidden [top:calc(100%+10px)] [max-width:calc(100vw-16px)]"
      role="menu"
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-3.5 px-4 pb-2.5">
        <p className="text-[15px] font-bold text-[#111] m-0">
          Notifications
          {count > 0 && (
            <span className="ml-[7px] text-sm font-semibold text-[#555]">
              {count}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onClearAll}
            disabled={isClearing || notifications.length === 0}
            className={`text-xs font-semibold text-[#E53E3E] bg-transparent border-none cursor-pointer p-0 ${isClearing || notifications.length === 0 ? "opacity-40" : "opacity-100"}`}
          >
            {isClearing ? "Clearing…" : "Clear All"}
          </button>
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-brand bg-transparent border-none cursor-pointer p-0"
          >
            Mark All As Read
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[440px] overflow-y-auto pb-1.5">
        {isLoading ? (
          <LoadingState className="py-8" />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" className="py-8" />
        ) : (
          buckets.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-[#999] tracking-[0.06em] uppercase pt-2.5 px-4 pb-[5px] m-0">
                {label}
              </p>
              <div className="flex flex-col gap-[5px] px-2.5">
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
        className="block w-full text-center text-xs font-semibold text-brand bg-stacked-container border-t border-t-[#E5E5E5] cursor-pointer py-2.5 px-0"
      >
        View all notifications
      </button>
    </div>
  );
}
