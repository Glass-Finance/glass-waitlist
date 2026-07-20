import { useMemo, useState } from "react";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Mail, User } from "lucide-react";
import { useInvites } from "../../hooks/useInvites";
import { useNotifications } from "../../hooks/useNotifications";
import { useCommunityMap } from "../../hooks/useCommunityMap";
import { notificationTarget } from "../../utils/notificationRouting";
import { isPaymentNotificationType, isSelfAccountType, notificationVisual } from "../../utils/notificationTypes";
import { extractNotificationDetails, formatNairaAmount } from "../../utils/notificationContent";
import { useAuth } from "../../store/AuthContext";
import PageLoadingState from "../../components/memberApp/PageLoadingState";
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
      <div className="w-[38px] h-[38px] rounded-full flex-shrink-0 overflow-hidden">
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
      style={{ background: bg }}
      className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center"
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
      className={`flex items-start gap-2.5 relative ${target ? "cursor-pointer" : "cursor-default"} ${isRead ? "py-2.5 px-1 bg-transparent rounded-none" : "py-3.5 px-4 bg-stacked-container rounded-xl"}`}
      onClick={() => {
        if (!isRead) onTap(n.id);
        if (target) onNavigate?.(target);
      }}
    >
      {!isRead && (
        <span className="absolute top-2.5 right-3 w-[7px] h-[7px] rounded-full bg-brand" />
      )}
      <NotifIcon n={n} />
      <div className={`flex-1 min-w-0 ${isRead ? "pr-0" : "pr-3.5"}`}>
        <p className="text-sm text-[#111] m-0 leading-[1.45]">
          {n.title && <span className={isRead ? "font-medium" : "font-bold"}>{n.title} </span>}
          {messageText && <span className="text-[#444]">{messageText}</span>}
          {!n.title && !messageText && <span className="font-medium">Notification</span>}
        </p>
        <p className="text-[11.5px] text-[#999] mt-1 mb-0">
          {amount && (
            <span className="text-[#111] font-semibold">{amount} · </span>
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
    <div
      className={`w-10 h-10 rounded-[10px] text-[#1C2B8A] flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden ${logo?.url ? "bg-transparent border-none" : "bg-[#1C2B8A22] border border-[#1C2B8A44]"}`}
    >
      {logo?.url
        ? <img src={logo.url} alt="" decoding="async" className="w-full h-full object-cover" />
        : initials}
    </div>
  );
}

function InviteCard({ invite, onAccept, onReject, busy }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-outline-on-surface">
      <div className="flex items-start gap-3 mb-3.5">
        <Avatar name={invite.community?.name} logo={invite.community?.logo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-[#111] m-0">{invite.community?.name ?? "Community"}</p>
            {invite.createdAt && (
              <span className="text-[11px] text-[#aaa] flex-shrink-0 whitespace-nowrap">
                {formatRelativeDateTime(invite.createdAt)}
              </span>
            )}
          </div>
          <p className="text-xs text-[#888] mt-0.5 mb-0">Invited you to join</p>
        </div>
      </div>
      <div className="flex gap-2.5">
        <button onClick={() => onAccept(invite)} disabled={busy}
          className="flex-1 py-3 rounded border-none bg-brand text-white text-sm font-semibold cursor-pointer">
          Accept
        </button>
        <button onClick={() => onReject(invite)} disabled={busy}
          className="flex-1 py-3 rounded border-[1.5px] border-brand bg-white text-brand text-sm font-semibold cursor-pointer">
          Decline
        </button>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, label, hint, onAction, actionLabel }) {
  return (
    <div className="border border-surface-container-border bg-white rounded-2xl p-8 flex flex-col items-center gap-2.5 text-center">
      <Icon size={22} strokeWidth={1.6} className="text-[#bbb]" />
      <p className="text-[#999] text-[13px] m-0">{label}</p>
      {hint && <p className="text-[#aaa] text-xs m-0 max-w-[240px] leading-relaxed">{hint}</p>}
      {onAction && (
        <button onClick={onAction}
          className="mt-1 py-2 px-4 rounded-lg border-[1.5px] border-brand bg-white text-brand text-[13px] font-semibold cursor-pointer">
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
    <div className="border border-surface-container-border bg-white rounded-2xl p-4 flex flex-col gap-4">
      {[...groups.entries()].map(([label, notifs]) => (
        <div key={label}>
          <p className="text-[13px] font-semibold text-[#555] mb-2">{label}</p>
          <div className="flex flex-col gap-0.5">
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
    <div className="relative overflow-hidden min-h-screen pb-10">
      <GlassLogoGlow />
      {/* Header */}
      <div className="flex items-center justify-center relative pt-6 px-5 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-medium text-[#111] m-0">Notifications</h1>
      </div>

      {/* Tab bar */}
      <div className="mx-4 mb-3 bg-white rounded-xl p-1 flex shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-[9px] rounded-[9px] border-none cursor-pointer text-[13px] transition-all duration-200 ${activeTab === tab ? "font-semibold bg-stacked-container text-[#111]" : "font-normal bg-transparent text-[#888]"}`}
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
        <div className="flex items-center justify-end gap-4 px-5 pb-3">
          <button
            onClick={() => clearAll()}
            disabled={isClearing}
            className={`text-[12.5px] font-semibold text-[#E53E3E] bg-transparent border-none cursor-pointer p-0 ${isClearing ? "opacity-50" : "opacity-100"}`}
          >
            {isClearing ? "Clearing…" : "Clear All"}
          </button>
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead}
            className={`text-[12.5px] font-semibold text-brand bg-transparent border-none cursor-pointer p-0 ${isMarkingAllRead ? "opacity-50" : "opacity-100"}`}
          >
            Mark All As Read
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
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
                <div className="flex flex-col gap-3">
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
