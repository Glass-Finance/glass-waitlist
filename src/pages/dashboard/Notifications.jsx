import { useState, useMemo } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";

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
  member:  { label: "Community Activity",border: "#1C2B8A" },
};

const TABS = ["All", "Urgent", "Payments", "Members"];
const TAB_CAT = { Urgent: "urgent", Payments: "payment", Members: "member" };

function Avatar({ title }) {
  const letter = (title ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
      <span className="text-xs font-semibold text-gray-500">{letter}</span>
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
      className="w-full text-left flex items-start gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <Avatar title={title} />
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
        <span className="w-2 h-2 rounded-full bg-[#1C2B8A] flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}

function SectionGroup({ sectionKey, items, onMarkRead }) {
  if (items.length === 0) return null;
  const { label } = SECTION_CONFIG[sectionKey];
  return (
    <div>
      <p className="px-5 py-2.5 text-xs font-semibold text-gray-400 bg-gray-50 border-b border-gray-100 uppercase tracking-wider">
        {label}
      </p>
      {items.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={onMarkRead} />)}
    </div>
  );
}

export default function Notifications() {
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
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Notifications</h1>
          <p className="text-sm text-gray-400">
            A full picture of your community's financial activity.
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
            className="px-4 py-2 rounded text-xs font-medium text-white bg-[#1C2B8A] hover:opacity-90 border-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Mark All As Read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 mb-5">
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
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-transparent border-none cursor-pointer transition-colors
                ${active ? "text-gray-900 border-b-2 border-[#1C2B8A] -mb-px" : "text-gray-400 hover:text-gray-700"}`}
            >
              {t}
              {count > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded text-[10px] font-bold flex items-center justify-center"
                  style={active
                    ? { background: "#1C2B8A", color: "#fff" }
                    : { background: "#EFEFF1", color: "#6b7280" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
          <>
            <SectionGroup sectionKey="urgent" items={byCategory.urgent} onMarkRead={markRead} />
            <SectionGroup sectionKey="payment" items={byCategory.payment} onMarkRead={markRead} />
            <SectionGroup sectionKey="member" items={byCategory.member} onMarkRead={markRead} />
          </>
        ) : (
          tabItems.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={markRead} />)
        )}
      </div>
    </div>
  );
}
