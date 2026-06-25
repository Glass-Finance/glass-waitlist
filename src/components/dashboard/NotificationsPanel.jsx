import { useNavigate } from "react-router-dom";
import { CheckCheck, Bell } from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationsPanel({ notifications, isLoading, onMarkRead, onMarkAllRead, onClose }) {
  const navigate = useNavigate();

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden"
      role="menu"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">Notifications</p>
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#002FA7] bg-transparent border-none cursor-pointer hover:opacity-70"
        >
          <CheckCheck size={12} />
          Mark all read
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-8">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <Bell size={20} className="text-gray-300" />
            <p className="text-xs text-gray-400">No notifications yet.</p>
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => {
            const isRead = n.isRead ?? n.read ?? false;
            return (
              <button
                key={n.id}
                onClick={() => !isRead && onMarkRead(n.id)}
                className="w-full text-left flex items-start gap-2.5 px-4 py-3 border-b border-gray-50 bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: isRead ? "transparent" : "#002FA7" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${isRead ? "text-gray-500" : "text-gray-900 font-medium"}`}>
                    {n.title ?? n.subject ?? n.message ?? "Notification"}
                  </p>
                  {n.title && n.message && (
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => {
          onClose?.();
          navigate("/dashboard/notifications");
        }}
        className="w-full text-center text-xs font-semibold text-[#002FA7] bg-gray-50 border-none cursor-pointer py-2.5 hover:bg-gray-100 transition-colors"
      >
        View all
      </button>
    </div>
  );
}
