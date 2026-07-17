import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Bell, ChevronRight, X, User, Building2 } from "lucide-react";
import { useNotifications, useAllNotifications } from "../../hooks/useNotifications";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { useCommunityMap } from "../../hooks/useCommunityMap";
import { useAuth } from "../../store/AuthContext";
import { notificationAction } from "../../utils/notificationRouting";
import { notificationCategory, isPaymentReceivedType, isPaymentNotificationType, isSelfAccountType, paymentNotificationIcon } from "../../utils/notificationTypes";
import { extractNotificationDetails, formatNairaAmount, initials } from "../../utils/notificationContent";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import { formatRelativeDateTime as formatTime } from "../../utils/format";

const SUPER_ADMIN_EMAIL = "glasspayhq@gmail.com";

// notificationCategory() maps the backend's exact notificationType enum to a
// tab — precise for every documented type. This heuristic only runs for
// notifications with a missing/unrecognized type (legacy data, or a type
// added server-side before this file's enum list catches up).
function categorizeHeuristic(n) {
  const t = (n.notificationType ?? n.type ?? "").toUpperCase();
  const title = (n.title ?? n.subject ?? "").toUpperCase();
  if (
    t.includes("FAIL") || t.includes("URGENT") || t.includes("ALERT") ||
    t.includes("DEFAULT") || t.includes("OVERDUE") || t.includes("SUSPEND")
  ) return "urgent";
  if (
    t.includes("MEMBER") || t.includes("JOIN") || t.includes("COMMUNITY") ||
    t.includes("INVITE") || t.includes("DEPART") || t.includes("REMOVE") ||
    t.includes("PROFILE") || t.includes("AVATAR") || t.includes("IMAGE") ||
    title.includes("PROFILE") || title.includes("IMAGE") || title.includes("AVATAR") ||
    title.includes("JOINED") || title.includes("MEMBER")
  ) return "member";
  // Covers PAYMENT, DUES, CONTRIBUTION, COLLECTION, etc.
  return "payment";
}

function categorize(n) {
  return notificationCategory(n.notificationType ?? n.type) ?? categorizeHeuristic(n);
}

const SECTION_CONFIG = {
  urgent:  { label: "Urgent",            border: "#E53E3E" },
  payment: { label: "Payment Activity",  border: "#D69E2E" },
  member:  { label: "Community Activity",border: "var(--color-brand)" },
};

// Failed/overdue payment notifications ("urgent") are still a payment event
// at heart — Figma's tab set folds them into "Payments" rather than giving
// them a separate tab, so TAB_CAT accepts either a single category or a list.
const TABS = ["All", "Payments", "Community"];
const TAB_CAT = { Payments: ["payment", "urgent"], Community: ["member"] };

// Payment-received notifications show the paying member's photo. A
// profile/account event is about the reader's own account, not a member
// or community, so it shows the current admin's own photo instead. Every
// other type (due, reminder, plan created, settings changed) has no
// single member it's "from" (a plan belongs to the community, not
// personally to whichever admin happened to create it), so those show the
// community logo. When no image is available at all: a payment-family
// notification isn't really "about" a person's name, so it gets a
// purpose-built icon for that stage of the payment lifecycle instead of
// initials; every other type still falls back to initials, and only
// resorts to a generic icon when there's truly no name to initial either.
function Avatar({ n, details }) {
  const { user } = useAuth();
  const type = n?.notificationType ?? n?.type;
  const isReceived = isPaymentReceivedType(type);
  const isPayment = isPaymentNotificationType(type);
  const isSelf = isSelfAccountType(type);
  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  const img = isSelf
    ? user?.profileImage?.url
    : isReceived
      ? details?.memberPhoto
      : details?.communityLogo;
  const name = isSelf
    ? selfName
    : isReceived
      ? (details?.memberName ?? details?.communityName)
      : (details?.communityName ?? details?.memberName);

  if (img) {
    return (
      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
        <img src={img} alt={name ?? ""} className="w-full h-full object-cover" />
      </div>
    );
  }

  const PaymentIcon = paymentNotificationIcon(type);
  if (isPayment && PaymentIcon) {
    return (
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #002FA7 100%)" }}
      >
        <PaymentIcon size={18} strokeWidth={2} />
      </div>
    );
  }

  // A bare "?" reads as broken, not intentional -- when there's truly no
  // name to initial (community couldn't be resolved at all, even by text
  // match), a plain icon on the same brand gradient looks like a
  // deliberate generic-avatar state instead.
  const GenericIcon = isSelf ? User : Building2;
  return (
    <div
      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
      style={{ background: "linear-gradient(135deg, #7C3AED 0%, #002FA7 100%)" }}
    >
      {name ? initials(name) : <GenericIcon size={16} strokeWidth={2} />}
    </div>
  );
}

// Matches the member app's row treatment exactly (src/pages/memberApp/
// Notifications.jsx): no per-row card/border/chevron -- rows sit flush
// inside one shared list container, and only unread ones get a
// highlighted background. Previously each row was its own bordered white
// card with a trailing chevron, which is why the two didn't match.
function NotificationRow({ n, onMarkRead, onOpen }) {
  const isRead = n.readFlag ?? false;
  const title = n.title ?? n.subject ?? "Notification";
  const desc = n.description ?? n.message ?? n.bodyText ?? "";
  const communityMap = useCommunityMap();
  const details = extractNotificationDetails(n, { communityMap });
  const amount = formatNairaAmount(details.amount);

  return (
    <button
      onClick={() => {
        if (!isRead) onMarkRead(n.id);
        onOpen(n);
      }}
      className="relative w-full text-left flex items-start gap-3 cursor-pointer border-none bg-transparent"
      style={{
        padding: isRead ? "10px 4px" : "14px 16px",
        background: isRead ? "transparent" : "var(--color-stacked-container)",
        borderRadius: isRead ? 0 : 12,
      }}
    >
      {!isRead && (
        <span className="absolute rounded-full bg-brand" style={{ top: 10, right: 12, width: 7, height: 7 }} />
      )}
      <Avatar n={n} details={details} />
      <div className="flex-1 min-w-0" style={{ paddingRight: isRead ? 0 : 14 }}>
        <p className={`text-sm leading-snug ${isRead ? "text-gray-500" : "text-gray-900 font-semibold"}`}>
          {title}
        </p>
        {desc && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1.5">
          {[details.memberName, details.communityName, formatTime(n.createdAt)]
            .filter(Boolean)
            .join(" · ")}
          {amount && <span className="text-gray-900 font-semibold"> · {amount}</span>}
        </p>
      </div>
    </button>
  );
}

// ── Notification detail ───────────────────────────────────────────────────────
// Notifications have no page of their own, so clicking a row opens this modal
// with the full (untruncated) content plus a contextual action button that
// deep-links to the related page when one can be inferred.
function NotificationDetailModal({ n, onClose }) {
  const navigate = useNavigate();
  const cat = categorize(n);
  const { label: catLabel, border } = SECTION_CONFIG[cat];
  const title = n.title ?? n.subject ?? "Notification";
  const desc = n.description ?? n.message ?? n.bodyText ?? n.body ?? "";
  const action = notificationAction(n);

  // Structured facts (#21): member, community, amount, plan, reference —
  // from real payload fields when present, best-effort text parsing otherwise.
  const communityMap = useCommunityMap();
  const details = extractNotificationDetails(n, { communityMap });
  const factRows = [
    { label: "Member", value: details.memberName },
    { label: "Community", value: details.communityName },
    { label: "Amount", value: formatNairaAmount(details.amount) },
    { label: "Payment plan", value: details.planName },
    { label: "Reference", value: details.reference, mono: true },
    { label: "Received", value: formatTime(details.time) },
  ].filter((r) => r.value);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar n={n} details={details} />
            <div className="min-w-0">
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                style={{ background: `${border}14`, color: border }}
              >
                {catLabel}
              </span>
              <p className="text-[15px] font-semibold text-gray-900 leading-snug">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer bg-transparent border-none flex-shrink-0 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {desc ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap m-0">{desc}</p>
          ) : (
            <p className="text-sm text-gray-400 m-0">No additional details.</p>
          )}

          {/* Facts — inner card matching the app's var(--color-surface-container)/#E5E7EB standard */}
          <div
            className="flex flex-col gap-2.5 mt-5 rounded-xl px-4 py-3.5 bg-surface-container"
            style={{ border: "1px solid #E5E7EB" }}
          >
            {factRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-500 flex-shrink-0">{r.label}</span>
                <span
                  className={`text-xs font-medium text-gray-900 text-right break-all ${r.mono ? "font-mono" : ""}`}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-container"
          style={{ borderTop: "1px solid #E5E7EB" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Close
          </button>
          {action && (
            <button
              onClick={() => navigate(action.to)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 cursor-pointer border-none transition-opacity"
            >
              {action.label} <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared behaviour for both list variants: modal open/close state plus the
// ?open=<id> deep link the topbar dropdown and home overview navigate with.
// The page list is scoped to the active community, but the topbar panel shows
// every community's notifications — so fall back to the unscoped list (already
// cached by the panel) when the deep-linked one isn't in the page's list.
function useNotificationDetail(notifications, markRead) {
  const { notifications: allNotifications } = useAllNotifications();
  const [openNotif, setOpenNotif] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");

  useEffect(() => {
    if (!openId) return;
    if (notifications.length === 0 && allNotifications.length === 0) return;
    const n =
      notifications.find((x) => String(x.id) === openId) ??
      allNotifications.find((x) => String(x.id) === openId);
    if (n) {
      setOpenNotif(n);
      if (!(n.readFlag ?? false)) markRead(n.id);
    }
    // Consume just the "open" param so refresh/back doesn't reopen the modal
    // -- replacing with {} used to wipe every other param too, including
    // ?community=, silently kicking the page back to the unscoped
    // all-communities view the moment a deep-linked notification opened.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("open");
      return next;
    }, { replace: true });
  }, [openId, notifications, allNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

  return { openNotif, open: setOpenNotif, close: () => setOpenNotif(null) };
}

// Date separator label used by the chronological view — Today / Yesterday /
// This Week (last 7 days) / a full date for anything older, matching the
// bucket set in the redesigned Notifications mockup.
function dayLabel(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diffDays = Math.floor((today - d) / 86400000);
  if (diffDays >= 0 && diffDays < 7) return "This Week";
  return d.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });
}

// All-tab: strict newest-first with date separators only (no category
// grouping). Wrapped in one shared bordered card -- matching the member
// app's GroupedNotifications, which holds every day-bucket in a single
// card rather than one card per row -- instead of rendering buckets
// directly into the page's scroll container.
function ChronologicalList({ items, onMarkRead, onOpen }) {
  if (items.length === 0) return null;

  const buckets = [];
  let currentLabel = null;
  for (const n of items) {
    const label = dayLabel(n.createdAt);
    if (label !== currentLabel) {
      buckets.push({ label, notifications: [] });
      currentLabel = label;
    }
    buckets[buckets.length - 1].notifications.push(n);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-4">
      {buckets.map(({ label, notifications }) => (
        <div key={label}>
          <p className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <div className="flex flex-col gap-0.5">
            {notifications.map((n) => (
              <NotificationRow key={n.id} n={n} onMarkRead={onMarkRead} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SuperAdminNotifications() {
  usePageTitle("Notifications");
  const {
    notifications, isLoading, unreadCount,
    markRead, markAllRead, isMarkingAllRead,
  } = useAllNotifications();
  const detail = useNotificationDetail(notifications, markRead);

  return (
    <div
      className="flex flex-col h-full px-4 md:px-6 py-6"
      style={{ minHeight: 0 }}
    >
      <div className="mb-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl font-bold text-black mb-1">Notifications</h1>
            <p className="text-sm text-gray-400">System alerts and platform events for your account.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={isMarkingAllRead}
              className="self-start flex-shrink-0 px-4 py-2 rounded text-xs font-medium text-white bg-brand hover:opacity-90 border-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              Mark All As Read
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading ? (
          <LoadingState className="py-12" />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            subtitle="You'll see payment updates, member activity, and other alerts here as they happen."
            className="py-16"
          />
        ) : (
          <ChronologicalList items={notifications} onMarkRead={markRead} onOpen={detail.open} />
        )}
      </div>

      {detail.openNotif && (
        <NotificationDetailModal n={detail.openNotif} onClose={detail.close} />
      )}
    </div>
  );
}

function CommunityNotifications() {
  usePageTitle("Notifications");
  const {
    notifications, isLoading, unreadCount,
    markRead, markAllRead, isMarkingAllRead,
    clearAll, isClearing,
  } = useNotifications();
  const [tab, setTab] = useState("All");
  const detail = useNotificationDetail(notifications, markRead);

  const byCategory = useMemo(() => ({
    payment: notifications.filter((n) => ["payment", "urgent"].includes(categorize(n))),
    member: notifications.filter((n) => categorize(n) === "member"),
  }), [notifications]);

  const tabItems = useMemo(() => {
    if (tab === "All") return notifications;
    const cats = TAB_CAT[tab];
    return notifications.filter((n) => cats.includes(categorize(n)));
  }, [notifications, tab]);

  return (
    <div
      className="flex flex-col h-full px-4 md:px-6 py-6"
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className="mb-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl font-bold text-black mb-1">Notifications</h1>
            <p className="text-sm text-gray-400">
              Stay on top of payments, member activity, and alerts.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => clearAll()}
              disabled={isClearing || notifications.length === 0}
              className="text-sm font-medium bg-transparent border-none cursor-pointer hover:opacity-70 disabled:opacity-40 disabled:cursor-default"
              style={{ color: "#E53E3E" }}
            >
              {isClearing ? "Clearing…" : "Clear All"}
            </button>
            <button
              onClick={() => markAllRead()}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="px-4 py-2 rounded text-xs font-medium text-white bg-brand hover:opacity-90 border-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              Mark All As Read
            </button>
          </div>
        </div>
      </div>

      {/* Tabs — matches Settings' Account/Finance/Community segmented style */}
      <div className="overflow-x-auto flex-shrink-0 mb-5">
      <div
        className="flex gap-1 bg-stacked-container rounded-md p-1 w-fit"
        style={{ border: "1px solid #fafafa" }}
      >
        {TABS.map((t) => {
          const count =
            t === "All" ? notifications.length :
            t === "Payments" ? byCategory.payment.length :
            byCategory.member.length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[13px] rounded transition-all cursor-pointer border-none font-medium
                ${active ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t}
              {count > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={active
                    ? { background: "#EEF2FF", color: "var(--color-brand)", border: "1px solid var(--color-brand)" }
                    : { background: "#fff", color: "#6b7280", border: "1px solid #E5E7EB" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      {/* Notification list — independently scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading ? (
          <LoadingState className="py-12" />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            subtitle="You'll see payment updates, member activity, and other alerts here as they happen."
            className="py-16"
          />
        ) : tabItems.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={`No ${tab.toLowerCase()} notifications`}
            className="py-12"
          />
        ) : (
          <ChronologicalList items={tabItems} onMarkRead={markRead} onOpen={detail.open} />
        )}
      </div>

      {detail.openNotif && (
        <NotificationDetailModal n={detail.openNotif} onClose={detail.close} />
      )}
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const activeCommunityId = useActiveCommunityId();
  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

  // The Platform Admin sidebar's own "Notifications" link (no community
  // context at all) is the only place the cross-platform view belongs.
  // Every other way of reaching this page -- the regular per-community
  // sidebar's "Notifications" item, the bell dropdown's per-community
  // destination, a notification row's own deep link -- carries or implies a
  // specific active community (via useActiveCommunityId's ?community= param
  // or its localStorage fallback, same convention Settings already uses
  // since this route never puts ?community= in its own URL). A super admin
  // is also a regular admin of their own real communities, so the email
  // check alone was locking them into the all-communities view even while
  // clearly inside one specific community's admin section.
  return isSuperAdmin && !activeCommunityId
    ? <SuperAdminNotifications />
    : <CommunityNotifications />;
}
