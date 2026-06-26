import { useNotifications } from "../../hooks/useNotifications";
import { CheckCheck, Bell } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const { notifications, isLoading, markRead, markAllRead, isMarkingAllRead } =
    useNotifications();

  return (
    <div className="flex flex-col h-full px-8 py-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Notifications</h1>
          <p className="text-xs text-gray-500">Everything that's happened across your communities.</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={isMarkingAllRead}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#002FA7] bg-transparent border-none cursor-pointer hover:opacity-70 disabled:opacity-50"
        >
          <CheckCheck size={14} />
          Mark all read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 max-w-2xl w-full overflow-hidden">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-12">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Bell size={22} className="text-gray-300" />
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = n.readFlag ?? false;
            return (
              <button
                key={n.id}
                onClick={() => !isRead && markRead(n.id)}
                className="w-full text-left flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-b-0 bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: isRead ? "transparent" : "#002FA7" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${isRead ? "text-gray-500" : "text-gray-900 font-semibold"}`}>
                    {n.title ?? n.subject ?? n.message ?? "Notification"}
                  </p>
                  {n.title && n.message && (
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
