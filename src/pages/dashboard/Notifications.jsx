import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { AlertTriangle, ArrowRight, Bell, Check, ChevronRight, X, User } from "lucide-react";
import { useNotifications, useAllNotifications } from "../../hooks/useNotifications";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { useCommunityMap } from "../../hooks/useCommunityMap";
import { useEscapeToClose } from "../../hooks/useKeyboardShortcuts";
import { useAuth } from "../../store/AuthContext";
import { notificationAction } from "../../utils/notificationRouting";
import { notificationCategory, isSelfAccountType, notificationVisual } from "../../utils/notificationTypes";
import { extractNotificationDetails, formatNairaAmount, resolveNotificationBody } from "../../utils/notificationContent";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import { Button } from "../../components/ui/Button";
import notificationsIllustration from "../../assets/dashboard/empty-states/notifications-illustration.webp";
import { formatRelativeDateTime as formatTime, dayLabel, toTitleCase } from "../../utils/format";

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
  urgent:  { label: "Urgent" },
  payment: { label: "Payment Activity" },
  member:  { label: "Community Activity" },
};

// Failed/overdue payment notifications ("urgent") are still a payment event
// at heart — Figma's tab set folds them into "Payments" rather than giving
// them a separate tab, so TAB_CAT accepts either a single category or a list.
const TABS = ["All", "Payments", "Community"];
const TAB_CAT = { Payments: ["payment", "urgent"], Community: ["member"] };

// Per Figma: notifications use a category icon, not a photo/initials
// avatar — even a clearly-named event ("X joined Y") shows a status icon
// rather than that person's photo. A self-account event is the one
// exception, since it's genuinely about the reader's own account and
// there's a real photo to show. Every other type gets a purpose-built
// icon + semantic color for its category (see notificationVisual) — red
// for failures/urgent, amber for due-soon, green for success, indigo for
// new/info, gray for neutral account notices.
function Avatar({ n, size = "sm" }) {
  const { user } = useAuth();
  const type = n?.notificationType ?? n?.type;
  const isSelf = isSelfAccountType(type);
  const selfName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;
  const boxCls = size === "lg" ? "w-14 h-14" : "w-9 h-9";
  const iconSize = size === "lg" ? 26 : 18;

  if (isSelf && user?.profileImage?.url) {
    return (
      <div className={`${boxCls} rounded-full flex-shrink-0 overflow-hidden`}>
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
      className={`${boxCls} rounded-full flex-shrink-0 flex items-center justify-center`}
      style={{ background: bg }}
    >
      <Icon size={iconSize} strokeWidth={2} color={fg} />
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
  const communityMap = useCommunityMap();
  const details = extractNotificationDetails(n, { communityMap });
  const desc = resolveNotificationBody(n, details, n.description ?? n.message ?? n.bodyText ?? "");
  const amount = formatNairaAmount(details.amount);

  return (
    <button
      onClick={() => {
        if (!isRead) onMarkRead(n.id);
        onOpen(n);
      }}
      className={`relative w-full text-left flex items-start gap-3 cursor-pointer border-none ${isRead ? "py-2.5 px-1 bg-transparent rounded-none" : "py-3.5 px-4 bg-stacked-container rounded-xl"}`}
    >
      {!isRead && (
        <span className="absolute rounded-full bg-brand top-2.5 right-3 w-[7px] h-[7px]" />
      )}
      <Avatar n={n} />
      <div className={`flex-1 min-w-0 ${isRead ? "pr-0" : "pr-3.5"}`}>
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
//
// Every notification type shared one generic template before — same badge,
// same box of rows, regardless of what actually happened. Each cluster of
// types gets its own body now: a confirmation (self-account), an urgency
// card (failed/overdue money), a people card (join/invite), a receipt
// (routine payments), or a plain info card as the fallback for anything else
// — sharing only the outer shell (header/close) and the shared discipline of
// no per-category color-coding (Wise/Nubank's pattern): brand blue only ever
// appears on a primary button, red only ever appears on the one cluster
// that's genuinely urgent, never as decoration.
function DetailShell({ catLabel, onClose, maxWidthCls, children }) {
  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full bg-surface-bg rounded-2xl shadow-2xl border border-surface-container-border overflow-hidden ${maxWidthCls}`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {catLabel}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent border-solid flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Right-aligned quiet rows shared by the receipt/urgent/info bodies — the
// facts that didn't become that body's own hero.
function FactRows({ rows }) {
  if (rows.length === 0) return null;
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
          <span
            className={`text-xs font-medium text-gray-700 text-right break-all tabular-nums ${r.mono ? "font-mono" : ""}`}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function NotificationDetailModal({ n, onClose }) {
  useEscapeToClose(onClose);
  const navigate = useNavigate();
  const { user } = useAuth();
  const catLabel = SECTION_CONFIG[categorize(n)].label;
  const title = n.title ?? n.subject ?? "Notification";
  const action = notificationAction(n);
  const isSelf = isSelfAccountType(n.notificationType ?? n.type);
  const cat = categorize(n);
  const goToAction = () => navigate(action.to);

  // Structured facts (#21): member, community, amount, plan, reference —
  // from real payload fields when present, best-effort text parsing otherwise.
  const communityMap = useCommunityMap();
  const details = extractNotificationDetails(n, { communityMap });
  const desc = resolveNotificationBody(n, details, n.description ?? n.message ?? n.bodyText ?? n.body ?? "");
  const amount = formatNairaAmount(details.amount);

  // ── Confirmation: self-account events (profile/password/email updates) ──
  // No amount, no other member, no other party — a confirmation about the
  // reader's own account, not a record about something/someone else.
  // Centered, closer to how the app treats a confirmation (see SuccessBadge)
  // than how it treats a transaction record.
  if (isSelf) {
    // n.channel is the backend's raw SCREAMING_SNAKE_CASE enum (IN_APP,
    // EMAIL, ...) -- humanize before showing it next to a plain-English
    // timestamp.
    const channelLabel = n.channel && toTitleCase(n.channel.toLowerCase().replace(/_/g, " "));
    const meta = [formatTime(details.time), channelLabel].filter(Boolean).join(" · ");
    return (
      <DetailShell catLabel={catLabel} onClose={onClose} maxWidthCls="max-w-[360px]">
        <div className="px-6 pt-4 pb-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            {user?.profileImage?.url ? (
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-50">
                <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full ring-4 ring-gray-50 bg-gray-100 flex items-center justify-center">
                <User size={30} className="text-gray-400" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-brand ring-2 ring-white flex items-center justify-center">
              <Check size={13} strokeWidth={3} className="text-white" />
            </div>
          </div>
          <p className="text-[17px] font-bold text-gray-900 leading-snug">{title}</p>
          {desc && (
            <p className="text-sm text-gray-500 leading-relaxed mt-1.5 m-0 max-w-[260px]">{desc}</p>
          )}
          {meta && <p className="text-xs text-gray-400 mt-3 m-0">{meta}</p>}
        </div>
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-sm text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Close
          </button>
          {action && (
            <Button onClick={goToAction} fullWidth={false} size="sm" className="px-4 flex items-center gap-1 !h-9 !py-0 !rounded-sm !text-[13px] !font-normal">
              {action.label} <ChevronRight size={13} />
            </Button>
          )}
        </div>
      </DetailShell>
    );
  }

  // ── Urgent: money that didn't move (failed/overdue/disabled auth/refund/
  // reconciliation). The one place red earns its keep — a real semantic
  // state, not a decorative per-category badge — and the one place a
  // single, unmissable action beats a split Close/action footer.
  if (cat === "urgent") {
    const factRows = [
      { label: "Member", value: details.memberName },
      { label: "Community", value: details.communityName },
      { label: "Payment plan", value: details.planName },
      { label: "Reference", value: details.reference, mono: true },
      { label: "Received", value: formatTime(details.time) },
    ].filter((r) => r.value);

    return (
      <DetailShell catLabel={catLabel} onClose={onClose} maxWidthCls="max-w-[400px]">
        <div className="px-6 pt-3 pb-5">
          <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <p className="text-[18px] font-bold text-gray-900 leading-snug">{title}</p>
          {desc && (
            <p className="text-sm text-gray-500 leading-relaxed mt-1.5 m-0 whitespace-pre-wrap">{desc}</p>
          )}
          {amount && (
            <p className="text-[26px] font-bold text-gray-900 tabular-nums mt-3 mb-0">{amount}</p>
          )}
        </div>
        <FactRows rows={factRows} />
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-gray-100">
          {action && (
            <Button
              onClick={goToAction}
              variant="danger"
              className="flex items-center justify-center gap-1"
            >
              {action.label} <ChevronRight size={13} />
            </Button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer py-1"
          >
            Not now
          </button>
        </div>
      </DetailShell>
    );
  }

  // ── People: join requests and invites — this is about a specific person
  // and which community they're connected to, so that's the hero (bigger
  // status-tinted icon + their name), not a fact buried in a row.
  if (cat === "member" && details.memberName) {
    const factRows = [
      { label: "Reference", value: details.reference, mono: true },
      { label: "Received", value: formatTime(details.time) },
    ].filter((r) => r.value);

    return (
      <DetailShell catLabel={catLabel} onClose={onClose} maxWidthCls="max-w-[400px]">
        <div className="px-6 pt-3 pb-5 flex items-start gap-3.5">
          <Avatar n={n} size="lg" />
          <div className="min-w-0 pt-1">
            <p className="text-[17px] font-bold text-gray-900 leading-snug truncate">
              {details.memberName}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{title}</p>
            {details.communityName && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <ArrowRight size={11} className="flex-shrink-0" />
                <span className="truncate">{details.communityName}</span>
              </p>
            )}
          </div>
        </div>
        <FactRows rows={factRows} />
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-sm text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Close
          </button>
          {action && (
            <Button onClick={goToAction} fullWidth={false} size="sm" className="px-4 flex items-center gap-1 !h-9 !py-0 !rounded-sm !text-[13px] !font-normal">
              {action.label} <ChevronRight size={13} />
            </Button>
          )}
        </div>
      </DetailShell>
    );
  }

  // ── Receipt: routine payment activity — the amount is the one fact worth
  // a big number, everything else is a quiet supporting row.
  if (cat === "payment" && amount) {
    const factRows = [
      { label: "Member", value: details.memberName },
      { label: "Community", value: details.communityName },
      { label: "Payment plan", value: details.planName },
      { label: "Reference", value: details.reference, mono: true },
      { label: "Received", value: formatTime(details.time) },
    ].filter((r) => r.value);

    return (
      <DetailShell catLabel={catLabel} onClose={onClose} maxWidthCls="max-w-[400px]">
        <div className="px-6 pt-3 pb-5">
          <p className="text-[32px] font-bold text-gray-900 leading-none tabular-nums mb-2">{amount}</p>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{title}</p>
          {desc && (
            <p className="text-sm text-gray-500 leading-relaxed mt-1.5 m-0 whitespace-pre-wrap">{desc}</p>
          )}
        </div>
        <FactRows rows={factRows} />
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-sm text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Close
          </button>
          {action && (
            <Button onClick={goToAction} fullWidth={false} size="sm" className="px-4 flex items-center gap-1 !h-9 !py-0 !rounded-sm !text-[13px] !font-normal">
              {action.label} <ChevronRight size={13} />
            </Button>
          )}
        </div>
      </DetailShell>
    );
  }

  // ── Info: the fallback for everything without a strong single hero fact
  // (settings changed, general notices) — and the safety net for any
  // cluster whose expected hero data (memberName/amount) didn't resolve on
  // a particular real payload, so nothing ever renders half-empty.
  const factRows = [
    { label: "Member", value: details.memberName },
    { label: "Community", value: details.communityName },
    { label: "Amount", value: amount },
    { label: "Reference", value: details.reference, mono: true },
    { label: "Received", value: formatTime(details.time) },
  ].filter((r) => r.value);

  return (
    <DetailShell catLabel={catLabel} onClose={onClose} maxWidthCls="max-w-[400px]">
      <div className="px-6 pt-3 pb-5">
        <div className="mb-2">
          <Avatar n={n} />
        </div>
        <p className="text-[16px] font-bold text-gray-900 leading-snug">{title}</p>
        {desc && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1.5 m-0 whitespace-pre-wrap">{desc}</p>
        )}
      </div>
      <FactRows rows={factRows} />
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
        >
          Close
        </button>
        {action && (
          <Button onClick={goToAction} fullWidth={false} size="sm" className="px-4 flex items-center gap-1 !h-9 !py-0 !rounded-sm !text-[13px] !font-normal">
            {action.label} <ChevronRight size={13} />
          </Button>
        )}
      </div>
    </DetailShell>
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
      // Opens the detail modal for a deep-linked (?open=) notification once
      // the list has loaded -- genuinely a one-time reaction to a URL param,
      // not a value derivable from render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="bg-white rounded-2xl border border-surface-container-border p-4 flex flex-col gap-4">
      {buckets.map(({ label, notifications }) => (
        <div key={label}>
          <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
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

// Cross-community view: every notification for this user regardless of
// which community it belongs to (useAllNotifications, unscoped). The only
// way here is the Platform Admin sidebar's own "Notifications" link (see
// the Notifications() switch below) -- Communities Home's overview card
// has no page-level "view all" of its own, since there's no single
// community page a cross-community "view all" could correctly deep-link
// into.
function AllCommunitiesNotifications() {
  usePageTitle("Notifications");
  const {
    notifications, isLoading, unreadCount,
    markRead, markAllRead, isMarkingAllRead,
  } = useAllNotifications();
  const detail = useNotificationDetail(notifications, markRead);

  return (
    <div
      className="flex flex-col h-full px-4 md:px-6 py-6 min-h-0"
    >
      <div className="mb-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl font-bold text-black mb-1">Notifications</h1>
            <p className="text-sm text-gray-400">Updates across every community you manage.</p>
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

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <LoadingState className="py-12" />
        ) : notifications.length === 0 ? (
          <EmptyState
            illustration={notificationsIllustration}
            illustrationClassName="w-[200px] h-auto mb-4"
            title="You're all caught up."
            subtitle="We'll let you know when something needs your attention."
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

  // Per the Figma empty state (mirrors Members.jsx/Payments.jsx's same fix):
  // the page header and tabs don't show at all when there are no
  // notifications at all -- distinct from tabItems.length === 0 below,
  // which is just the current tab matching nothing and still needs the
  // header/tabs to switch away from it.
  const isEmpty = !isLoading && notifications.length === 0;

  return (
    <div
      className="flex flex-col h-full px-4 md:px-6 py-6 min-h-0"
    >
      {/* Header */}
      {!isEmpty && (
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
              onClick={() => markAllRead()}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="px-4 py-2 rounded text-xs font-medium text-white bg-brand hover:opacity-90 border-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              Mark All As Read
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Tabs — matches Settings' Account/Finance/Community segmented style */}
      {!isEmpty && (
      <div className="overflow-x-auto flex-shrink-0 mb-5">
      <div
        className="flex gap-1 bg-stacked-container rounded-md p-1 w-fit border border-[#fafafa]"
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
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                    active ? "border-brand bg-[#EEF2FF] text-brand" : "border-surface-container-border bg-white text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>
      )}

      {/* Notification list — independently scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <LoadingState className="py-12" />
        ) : notifications.length === 0 ? (
          <EmptyState
            illustration={notificationsIllustration}
            illustrationClassName="w-[200px] h-auto mb-4"
            title="You're all caught up."
            subtitle="We'll let you know when something needs your attention."
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
  const { isPlatformAdmin } = useAuth();
  const activeCommunityId = useActiveCommunityId();

  // The Platform Admin sidebar's own "Notifications" link (no community
  // context at all) is the only place the cross-community view belongs.
  // Every other way of reaching this page -- the regular per-community
  // sidebar's "Notifications" item, the bell dropdown's per-community
  // destination, a notification row's own deep link -- carries or implies a
  // specific active community (via useActiveCommunityId's ?community= param
  // or its localStorage fallback, same convention Settings already uses
  // since this route never puts ?community= in its own URL). A platform admin
  // may also administer communities, so the global-role flag alone must not
  // force the cross-community view when a community context is active.
  return isPlatformAdmin && !activeCommunityId
    ? <AllCommunitiesNotifications />
    : <CommunityNotifications />;
}
