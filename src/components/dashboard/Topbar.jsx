/**
 * Topbar.jsx
 * Wired to real auth + notifications.
 *
 * Reads:  useAuth() → user
 *         useNotifications() → GET /api/v1/notifications, GET .../unread-count
 * Actions: Bell → opens notification dropdown panel
 *          User avatar → navigate to /dashboard/settings
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Loader2, Menu } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { useAllNotifications } from "../../hooks/useNotifications";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { useCommunities } from "../../hooks/useCommunities";
import client from "../../api/client";
import NotificationsPanel from "./NotificationsPanel";

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })
    .format(amount ?? 0)
    .replace("NGN", "₦");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// user.firstName/lastName come from AuthContext's refreshUser() (GET /user/me)
// — the login/register response itself only has {id, email, role,
// emailVerified}, no name fields, so there's nothing to parse off it directly.
function getInitials(user) {
  if (!user) return "?";
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  if (first || last) return (first + last).toUpperCase();
  return (user.email ?? "?").slice(0, 2).toUpperCase();
}

function getDisplayName(user) {
  if (!user) return "Loading...";
  if (user.firstName) return `${user.firstName} ${user.lastName ?? ""}`.trim();
  return user.email ?? "User";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Topbar({
  searchPlaceholder = "Search members, payments, receipts...",
  onMenuClick,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const communityId = useActiveCommunityId();

  // Panel uses all-community notifications so the dropdown is universal
  const { notifications, isLoading, unreadCount, markRead, markAllRead } =
    useAllNotifications();

  // Build a communityId/slug → community lookup for the panel cards
  const { data: communitiesData } = useCommunities();
  const communityMap = useMemo(() => {
    const map = new Map();
    for (const c of communitiesData?.communities ?? []) {
      if (c.id)   map.set(c.id,   c);
      if (c.slug) map.set(c.slug, c);
    }
    return map;
  }, [communitiesData]);
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

  // ── Search — GET /communities/{id}/search, debounced (backend requires
  // 2+ chars and returns a capped top-10 preview per category). ───────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  useEffect(() => {
    const q = query.trim();
    if (!communityId || q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await client.get(`/communities/${communityId}/search`, {
          params: { search: q, pageSize: 5 },
        });
        setResults(data?.data ?? null);
        setSearchOpen(true);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, communityId]);

  function goToResult(path) {
    setSearchOpen(false);
    setQuery("");
    navigate(path);
  }

  const searchMembers = results?.members?.content ?? [];
  const searchTransactions = results?.transactions?.content ?? [];
  const searchPaymentLinks = results?.paymentLinks?.content ?? [];
  const searchSettlements = results?.settlements?.content ?? [];
  const hasSearchResults =
    searchMembers.length || searchTransactions.length || searchPaymentLinks.length || searchSettlements.length;

  return (
    <header className="h-14 bg-[#EFEFF1E5] border-b border-[#EFEFF1] flex items-center gap-4 px-4 md:px-6 sticky top-0 z-50 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden bg-transparent border-none cursor-pointer text-gray-600 hover:text-gray-900 transition-colors p-0 flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-[420px] hidden md:block" ref={searchRef}>
        <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-100 focus-within:ring-1 focus-within:ring-[#002FA7]">
          {searching ? (
            <Loader2 size={14} className="text-gray-400 flex-shrink-0 animate-spin" />
          ) : (
            <Search size={14} className="text-gray-400 flex-shrink-0" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results) setSearchOpen(true); }}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
          />
        </div>

        {searchOpen && query.trim().length >= 2 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl border border-gray-100 shadow-lg z-50 max-h-[420px] overflow-y-auto">
            {!hasSearchResults ? (
              <p className="text-xs text-gray-400 px-4 py-4">No results for "{query.trim()}"</p>
            ) : (
              <>
                {searchMembers.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Members</p>
                    {searchMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => goToResult(`/dashboard/members/${m.id}?community=${communityId}`)}
                        className="w-full flex items-center justify-between gap-2.5 px-4 py-2 hover:bg-gray-50 text-left bg-transparent border-none cursor-pointer"
                      >
                        <span className="text-xs font-medium text-gray-900">{m.firstName} {m.lastName}</span>
                        <span className="text-[11px] text-gray-400">{m.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchTransactions.length > 0 && (
                  <div className="py-2 border-t border-gray-50">
                    <p className="px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Transactions</p>
                    {searchTransactions.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => goToResult(`/dashboard/payments?community=${communityId}`)}
                        className="w-full flex items-center justify-between gap-2.5 px-4 py-2 hover:bg-gray-50 text-left bg-transparent border-none cursor-pointer"
                      >
                        <span className="text-xs font-medium text-gray-900 truncate">{t.memberName ?? t.paymentLinkTitle ?? t.internalReference}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{formatNaira(t.amount)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchPaymentLinks.length > 0 && (
                  <div className="py-2 border-t border-gray-50">
                    <p className="px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Payment Links</p>
                    {searchPaymentLinks.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => goToResult(`/dashboard/payments?community=${communityId}`)}
                        className="w-full flex items-center justify-between gap-2.5 px-4 py-2 hover:bg-gray-50 text-left bg-transparent border-none cursor-pointer"
                      >
                        <span className="text-xs font-medium text-gray-900">{p.title}</span>
                        <span className="text-[11px] text-gray-400">{p.status}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchSettlements.length > 0 && (
                  <div className="py-2 border-t border-gray-50">
                    <p className="px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Settlements</p>
                    {searchSettlements.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2.5 px-4 py-2">
                        <span className="text-xs font-medium text-gray-900">{s.status}</span>
                        <span className="text-[11px] text-gray-400">{formatNaira(s.netAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
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
              unreadCount={unreadCount}
              communityMap={communityMap}
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002FA7] to-[#4f46e5] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none overflow-hidden">
            {user?.profileImage?.url ? (
              <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#000000] leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">{email}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
