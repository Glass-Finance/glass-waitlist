import { useState, useMemo } from "react";
import { Bell, AlertCircle, CreditCard, Users } from "lucide-react";
import { useNotifications, useAllNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../store/AuthContext";
import Background from "../../assets/background.png";

const SUPER_ADMIN_EMAIL = "glasspayhq@gmail.com";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} ${time}`;
}

function categorize(n) {
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

const SECTION_CONFIG = {
  urgent:  { label: "Urgent",            border: "#E53E3E" },
  payment: { label: "Payment Activity",  border: "#D69E2E" },
  member:  { label: "Community Activity",border: "#002FA7" },
};

const TABS = ["All", "Urgent", "Payments", "Members"];
const TAB_CAT = { Urgent: "urgent", Payments: "payment", Members: "member" };

const ICON_META = {
  urgent:  { bg: "#FEF2F2", color: "#EF4444", Icon: AlertCircle },
  payment: { bg: "#FFFBEB", color: "#CA8A04", Icon: CreditCard  },
  member:  { bg: "#EEF2FF", color: "#002FA7", Icon: Users       },
};

function Avatar({ cat }) {
  const { bg, color, Icon } = ICON_META[cat] ?? ICON_META.payment;
  return (
    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: bg }}>
      <Icon size={16} color={color} strokeWidth={2} />
    </div>
  );
}

function NotificationRow({ n, onMarkRead }) {
  const isRead = n.readFlag ?? false;
  const cat = categorize(n);
  const borderColor = SECTION_CONFIG[cat].border;
  const title = n.title ?? n.subject ?? "Notification";
  const desc = n.description ?? n.message ?? "";

  return (
    <button
      onClick={() => !isRead && onMarkRead(n.id)}
      className="w-full text-left flex items-start gap-3 px-4 py-4 bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
      style={{
        border: "1px solid #E5E7EB",
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <Avatar cat={cat} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isRead ? "text-gray-500" : "text-gray-900 font-semibold"}`}>
          {title}
        </p>
        {desc && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1.5">{formatTime(n.createdAt)}</p>
      </div>
      {!isRead && (
        <span className="w-2 h-2 rounded-full bg-[#002FA7] flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}

function SectionGroup({ sectionKey, items, onMarkRead }) {
  if (items.length === 0) return null;
  const { label } = SECTION_CONFIG[sectionKey];
  return (
    <div>
      <p className="py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={onMarkRead} />)}
      </div>
    </div>
  );
}

// Date separator label used by the All-tab chronological view
function dayLabel(dateStr) {
  if (!dateStr) return "Earlier";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });
}

// All-tab: strict newest-first with date separators only (no category grouping)
function ChronologicalList({ items, onMarkRead }) {
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
    <>
      {buckets.map(({ label, notifications }) => (
        <div key={label} className="flex flex-col gap-2">
          <p className="pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} onMarkRead={onMarkRead} />
          ))}
        </div>
      ))}
    </>
  );
}

function SuperAdminNotifications() {
  const {
    notifications, isLoading, unreadCount,
    markRead, markAllRead, isMarkingAllRead,
  } = useAllNotifications();

  return (
    <div
      className="flex flex-col h-full px-6 py-6"
      style={{
        minHeight: 0,
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-black mb-1">Notifications</h1>
          <p className="text-sm text-gray-400">System alerts and platform events for your account.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead}
            className="px-4 py-2 rounded text-xs font-medium text-white bg-[#002FA7] hover:opacity-90 border-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Mark All As Read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-12">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Bell size={22} className="text-gray-300" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </div>
        ) : (
          <ChronologicalList items={notifications} onMarkRead={markRead} />
        )}
      </div>
    </div>
  );
}

function CommunityNotifications() {
  const {
    notifications, isLoading, unreadCount,
    markRead, markAllRead, isMarkingAllRead,
    clearAll, isClearing,
  } = useNotifications();
  const [tab, setTab] = useState("All");

  const byCategory = useMemo(() => ({
    urgent: notifications.filter((n) => categorize(n) === "urgent"),
    payment: notifications.filter((n) => categorize(n) === "payment"),
    member: notifications.filter((n) => categorize(n) === "member"),
  }), [notifications]);

  const tabItems = useMemo(() => {
    if (tab === "All") return notifications;
    return notifications.filter((n) => categorize(n) === TAB_CAT[tab]);
  }, [notifications, tab]);

  return (
    <div
      className="flex flex-col h-full px-6 py-6"
      style={{
        minHeight: 0,
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-black mb-1">Notifications</h1>
          <p className="text-sm text-gray-400">
            Stay on top of payments, member activity, and alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            className="px-4 py-2 rounded text-xs font-medium text-white bg-[#002FA7] hover:opacity-90 border-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Mark All As Read
          </button>
        </div>
      </div>

      {/* Tabs — matches Settings' Account/Finance/Community segmented style */}
      <div
        className="flex gap-1 mb-5 bg-[#EFEFF1] rounded-md p-1 w-fit flex-shrink-0"
        style={{ border: "1px solid #fafafa" }}
      >
        {TABS.map((t) => {
          const count =
            t === "All" ? notifications.length :
            t === "Urgent" ? byCategory.urgent.length :
            t === "Payments" ? byCategory.payment.length :
            byCategory.member.length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[13px] transition-all cursor-pointer border-none font-medium
                ${t === "Urgent" ? "rounded-none" : "rounded"}
                ${active ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t}
              {count > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={active
                    ? { background: "#EEF2FF", color: "#002FA7", border: "1px solid #002FA7" }
                    : { background: "#fff", color: "#6b7280", border: "1px solid #E5E7EB" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list — independently scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-12">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Bell size={22} className="text-gray-300" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </div>
        ) : tabItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <Bell size={18} className="text-gray-300" />
            <p className="text-sm text-gray-400">No {tab.toLowerCase()} notifications.</p>
          </div>
        ) : tab === "All" ? (
          <ChronologicalList items={notifications} onMarkRead={markRead} />
        ) : (
          <div className="flex flex-col gap-2">
            {tabItems.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={markRead} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  return user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL
    ? <SuperAdminNotifications />
    : <CommunityNotifications />;
}
