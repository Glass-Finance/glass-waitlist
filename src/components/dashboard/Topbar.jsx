/**
 * Topbar.jsx
 * Wired to real auth + notifications.
 *
 * Reads:  useAuth() → user
 *         useNotifications() → GET /api/v1/notifications, GET .../unread-count
 * Actions: Bell → opens notification dropdown panel
 *          User avatar → navigate to /dashboard/settings
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationsPanel from "./NotificationsPanel";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(user) {
  if (!user) return "?";
  // The User API returns userData as a JSON string containing firstName/lastName
  // Try to parse it; fall back to email initial
  try {
    if (user.userData && typeof user.userData === "string") {
      const parsed = JSON.parse(user.userData);
      const first = parsed.firstName?.[0] ?? "";
      const last = parsed.lastName?.[0] ?? "";
      if (first || last) return (first + last).toUpperCase();
    }
    if (user.userData && typeof user.userData === "object") {
      const first = user.userData.firstName?.[0] ?? "";
      const last = user.userData.lastName?.[0] ?? "";
      if (first || last) return (first + last).toUpperCase();
    }
  } catch {
    /* ignore */
  }
  // Fallback: first two chars of email
  return (user.email ?? "?").slice(0, 2).toUpperCase();
}

function getDisplayName(user) {
  if (!user) return "Loading...";
  try {
    const ud =
      typeof user.userData === "string"
        ? JSON.parse(user.userData)
        : user.userData;
    if (ud?.firstName) return `${ud.firstName} ${ud.lastName ?? ""}`.trim();
  } catch {
    /* ignore */
  }
  return user.accountName ?? user.email ?? "User";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Topbar({
  searchPlaceholder = "Search members, payments, receipts...",
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, isLoading, unreadCount, markRead, markAllRead } =
    useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  const initials = getInitials(user);
  const displayName = getDisplayName(user);
  const email = user?.email ?? "";

  // Close the dropdown on outside click
  useEffect(() => {
    if (!panelOpen) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [panelOpen]);

  return (
    <header className="h-14 bg-white border-b border-[#EFEFF1] flex items-center gap-4 px-6 sticky top-0 z-50 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-[420px] flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-100 focus-within:ring-1 focus-within:ring-[#002FA7]">
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
        />
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-4">
        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="relative bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700 transition-colors p-0"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold px-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <NotificationsPanel
              notifications={notifications}
              isLoading={isLoading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setPanelOpen(false)}
            />
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#eef0f8]" />

        {/* User */}
        <button
          onClick={() => navigate("/dashboard/settings")}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity p-0"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C2B8A] to-[#4f46e5] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none">
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#0f1d6e] leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">{email}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
