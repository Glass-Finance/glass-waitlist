/**
 * Sidebar.jsx — wired to real API
 *
 * Data sources:
 *   GET /api/v1/communities/me  → list of user's communities
 *   useAuth()                   → user, logout
 *
 * URL convention (matches App.jsx routes):
 *   /dashboard/:communitySlug/home
 *   /dashboard/:communitySlug/payments
 *   /dashboard/:communitySlug/members
 *   /dashboard/:communitySlug/settings
 *
 * If there is no communitySlug in the URL (e.g. /dashboard/home — the
 * communities overview page), no community is highlighted and the nav
 * panel shows generic labels.
 */

import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useInvites } from "../../hooks/useInvites";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../store/AuthContext";
import { useCommunities } from "../../hooks/useCommunities";
import { useMyMemberRecord } from "../../hooks/useMyAccount";
import { resolveIsPayingAdmin } from "../../utils/communityRole";

// ─── Nav items ────────────────────────────────────────────────────────────────
// `path` is the route under /dashboard; "home" maps to the per-community
// admin dashboard ("admin"), which keeps its own URL convention
// (?community=slug — see AdminDashboard.jsx) distinct from the
// /dashboard/home communities-overview page.
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     segment: "home",          path: "admin" },
  { icon: CreditCard,      label: "Payment Plans", segment: "payments",      path: "payments" },
  { icon: Users,           label: "Members",       segment: "members",       path: "members" },
  { icon: Bell,            label: "Notifications", segment: "notifications", path: "notifications" },
  { icon: Settings,        label: "Settings",      segment: "settings",      path: "settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Matches the ?community= query-param convention already used by
// AdminDashboard.jsx / CommunitiesHome.jsx — "settings" doesn't need it.
// "admin" has two variants (AdminDashboard.jsx's two exports) depending on
// whether this admin pays dues as a member of their own community — isPaying
// has to be resolved by the caller (see resolveIsPayingAdmin) since it's
// per-community, not derivable from the slug alone.
function communityPath(slug, path, isPaying = false) {
  // Global pages — no community scoping needed
  if (path === "settings" || path === "notifications") return `/dashboard/${path}`;
  const resolvedPath = path === "admin" && isPaying ? "admin/paying" : path;
  return `/dashboard/${resolvedPath}?community=${slug}`;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const userDisplayName = ([user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const userInitials = (user?.firstName || user?.lastName)
    ? `${(user?.firstName ?? "")[0] ?? ""}${(user?.lastName ?? "")[0] ?? ""}`.toUpperCase()
    : (user?.email ?? "").slice(0, 2).toUpperCase() || "?";

  const { data: communitiesData, isLoading: loading } = useCommunities();
  const communities = communitiesData?.communities ?? [];
  const { unreadCount } = useNotifications();
  const { invites } = useInvites();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [memberViewHint, setMemberViewHint] = useState(false);

  // Active route segment: /dashboard/admin → "home", /dashboard/payments →
  // "payments", etc. (matches the flat ?community= convention, not slugs-in-path)
  const pathParts = location.pathname.split("/").filter(Boolean);
  const routeSegment = pathParts[1] ?? "home"; // "home" | "admin" | "payments" | "members" | "settings"
  const activeSegment = routeSegment === "admin" ? "home" : routeSegment;
  const onCommunitiesOverview = location.pathname === "/dashboard/home";

  // Active community: ?community= param, falling back to the last one
  // stashed in localStorage (see useActiveCommunityId.js) — except on the
  // communities overview itself, whose whole purpose is choosing one. The
  // localStorage fallback exists for navigating *between* a community's
  // own pages (Settings doesn't carry ?community= in its URL at all), not
  // for skipping the choice from the one page that's supposed to require it.
  const urlSlug =
    searchParams.get("community") ??
    (onCommunitiesOverview
      ? null
      : (() => {
          try {
            const stored = JSON.parse(localStorage.getItem("glass_community") ?? "{}");
            return stored.slug ?? stored.id ?? null;
          } catch {
            return null;
          }
        })());

  const activeCommunity = urlSlug
    ? (communities.find((c) => c.slug === urlSlug) ?? null)
    : null;

  // Use the cached member record to derive paying status — same data source
  // as Role.jsx, so no extra network call and no race condition.
  const { data: myMemberRecord } = useMyMemberRecord(activeCommunity?.slug ?? null);
  const activeCommunityIsPaying = myMemberRecord?.billingExempt === false;

  // ── Handle logout ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/sign-in", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const W = collapsed ? 0 : 220;

  // ── Super-admin: stripped-down sidebar, no community nav ──────────────────
  if (user?.email?.toLowerCase() === "glasspayhq@gmail.com") {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[55] md:hidden"
            onClick={onCloseMobile}
          />
        )}
        <div
          className={`fixed md:sticky top-0 left-0 h-screen z-[60] flex-shrink-0 flex transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
        {/* Blue rail */}
        <div
          className="flex-shrink-0 bg-[#002FA7] flex flex-col items-center pt-3.5 pb-5"
          style={{ width: 56 }}
        >
          <button
            onClick={() => {
              navigate("/dashboard/admin-panel");
              onCloseMobile?.();
            }}
            className="mb-4 p-0 bg-transparent border-none cursor-pointer"
            title="Platform Admin"
          >
            <img
              src="/Glass.webp"
              alt="Glass"
              className="w-8 h-8 object-contain brightness-0 invert block"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.nextSibling)
                  e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
            <div
              className="hidden w-8 h-8 rounded-md bg-white/25 items-center justify-center text-white font-black text-base"
              aria-hidden="true"
            >
              G
            </div>
          </button>

          <button
            onClick={() => {
              navigate("/dashboard/admin-panel");
              onCloseMobile?.();
            }}
            title="Platform Admin"
            className="w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center bg-white/20 text-white transition-all hover:bg-white/30"
          >
            <ShieldCheck size={16} />
          </button>

          <div className="flex-1" />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log out"
            className="w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-50"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* White panel */}
        <div
          className="bg-white md:bg-[#EFEFF1E5]"
          style={{
            width: 220,
            borderRight: "1px solid #eef0f8",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            style={{
              padding: "14px 12px 13px",
              borderBottom: "1px solid #eef0f8",
              minHeight: 56,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#002FA7", lineHeight: 1.3 }}>
                Platform Admin
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#7c3aed",
                  background: "#f5f3ff",
                  borderRadius: 99,
                  padding: "1px 7px",
                }}
              >
                Super Admin
              </span>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "10px 8px" }}>
            {[
              { icon: ShieldCheck, label: "Admin Panel",  path: "/dashboard/admin-panel",               match: "/dashboard/admin-panel" },
              { icon: Bell,        label: "Notifications", path: "/dashboard/notifications",              match: "/dashboard/notifications" },
              { icon: Settings,    label: "Settings",      path: "/dashboard/settings/account/security", match: "/dashboard/settings" },
            ].map(({ icon: Icon, label, path, match }) => {
              const isActive = location.pathname.startsWith(match);
              const badge = label === "Notifications" && unreadCount > 0 ? unreadCount : 0;
              return (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    onCloseMobile?.();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "#e6eeff" : "transparent",
                    color: isActive ? "#002FA7" : "#6b7280",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 12,
                    fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap",
                    marginBottom: 2,
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                  {badge > 0 && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 99,
                      background: "#e11d48", color: "#fff",
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 4px", flexShrink: 0,
                    }}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #eef0f8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#7c3aed,#002FA7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 10, fontWeight: 700,
                flexShrink: 0,
              }}
            >
              SA
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[55] md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen z-[60] flex-shrink-0 flex transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      {/* ── Blue rail ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-[#002FA7] flex flex-col items-center pt-3.5 pb-5"
        style={{ width: 56 }}
      >
        {/* Logo — goes to communities overview */}
        <button
          onClick={() => {
            navigate("/dashboard/home");
            onCloseMobile?.();
          }}
          className="mb-4 p-0 bg-transparent border-none cursor-pointer"
          title="Your Communities"
        >
          <img
            src="/Glass.webp"
            alt="Glass"
            className="w-8 h-8 object-contain brightness-0 invert block"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling)
                e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div
            className="hidden w-8 h-8 rounded-md bg-white/25 items-center justify-center text-white font-black text-base"
            aria-hidden="true"
          >
            G
          </div>
        </button>

        {/* Home (communities overview) */}
        <button
          onClick={() => {
            navigate("/dashboard/home");
            onCloseMobile?.();
          }}
          title="Your Communities"
          className={`w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center mb-3 transition-all ${
            onCommunitiesOverview
              ? "bg-white text-[#002FA7]"
              : "bg-white/15 text-white hover:bg-white/25"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21V12h6v9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="w-5 h-px bg-white/20 mb-3" />

        {/* Community avatar list */}
        <div className="flex flex-col gap-2 items-center flex-1 overflow-y-auto w-full px-2">
          {loading ? (
            // Skeleton
            [0, 1].map((i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-xl bg-white/10 animate-pulse"
              />
            ))
          ) : communities.filter((c) => c.owned).length === 0 ? (
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white/40 text-[10px]">—</span>
            </div>
          ) : (
            communities.filter((c) => c.owned).map((c) => {
              const isActive = c.slug === urlSlug;
              const initials = getInitials(c.name);
              return (
                <button
                  key={c.id}
                  onClick={async () => {
                    localStorage.setItem("glass_community", JSON.stringify(c));
                    const isPaying = await resolveIsPayingAdmin(c.slug);
                    navigate(communityPath(c.slug, "admin", isPaying));
                    onCloseMobile?.();
                  }}
                  title={c.name}
                  className={`w-9 h-9 rounded-xl border cursor-pointer flex items-center justify-center font-extrabold text-[11px] transition-all select-none overflow-hidden flex-shrink-0 ${
                    isActive
                      ? "bg-white text-[#002FA7] shadow-md border-white"
                      : "bg-white/15 text-white hover:bg-white/30 border-white/15 hover:border-white/30"
                  }`}
                >
                  {c.logo?.url ? (
                    <img
                      src={c.logo.url}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    initials || "?"
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Super-admin shortcut — only visible to glasspayhq@gmail.com */}
        {user?.email?.toLowerCase() === "glasspayhq@gmail.com" && (
          <button
            onClick={() => {
              navigate("/dashboard/admin-panel");
              onCloseMobile?.();
            }}
            title="Platform Admin"
            className="mt-2 w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all"
          >
            <ShieldCheck size={15} />
          </button>
        )}

        {/* Logout button pinned to bottom of rail */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Log out"
          className="mt-2 w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* ── White nav panel ────────────────────────────────────────────────── */}
      {!onCommunitiesOverview  && (
      <div
        className="bg-white md:bg-[#EFEFF1E5]"
        style={{
          width: W,
          borderRight: "1px solid #eef0f8",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width .22s cubic-bezier(0.4,0,0.2,1)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Org header */}
        <div
          style={{
            padding: "14px 12px 13px",
            borderBottom: "1px solid #eef0f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            minHeight: 56,
          }}
        >
          {activeCommunity ? (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#000000",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.3,
                }}
              >
                {activeCommunity.name}
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  color: activeCommunity.owned ? "#e85d04" : "#059669",
                  background: activeCommunity.owned ? "#fff4ee" : "#ecfdf5",
                  borderRadius: 99,
                  padding: "1px 7px",
                }}
              >
                {activeCommunity.owned ? "Admin" : "Member"}
              </span>
            </div>
          ) : (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#000000",
                  lineHeight: 1.3,
                }}
              >
                Your Communities
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          {/* <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              flexShrink: 0,
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={15} />
            ) : (
              <PanelLeftClose size={15} />
            )}
          </button> */}
        </div>

        {/* Nav links */}
        <nav data-tour="sidebar-nav" style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {NAV.map(({ icon: Icon, label, segment, path }) => {
            const isActive = activeSegment === segment;
            // Every nav item except "Dashboard" (which points at the
            // communities overview when none is selected) requires an
            // active community — matches the blue-rail community picker
            // being the only way to get into a community's admin area.
            const href = activeCommunity
              ? communityPath(activeCommunity.slug, path, activeCommunityIsPaying)
              : segment === "home"
                ? "/dashboard/home"
                : null;
            const isDisabled = !href;
            const badge = segment === "notifications" && unreadCount > 0 ? unreadCount : 0;

            return (
              <button
                key={segment}
                onClick={() => {
                  if (href) {
                    navigate(href);
                    onCloseMobile?.();
                  }
                }}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "none",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  background: isActive ? "#e6eeff" : "transparent",
                  color: isActive ? "#002FA7" : isDisabled ? "#9ca3af" : "#6b7280",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  marginBottom: 2,
                  transition: "all .15s",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isDisabled)
                    e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                {badge > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 99,
                    background: "#e11d48", color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px", flexShrink: 0,
                  }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Member View switch */}
        <div style={{ padding: "0 8px 8px", position: "relative" }}>
          <div style={{ height: 1, background: "#eef0f8", marginBottom: 8 }} />
          <button
            onClick={() => {
              // If the admin is also a member of the community they're
              // currently viewing, that's the "own Member View" they'd
              // expect this button to open — not some unrelated community
              // they happen to belong to. Only fall back to searching for
              // any other membership (or the invites hint) when there's no
              // such same-community membership to switch into.
              if (activeCommunity && myMemberRecord) {
                try {
                  localStorage.setItem(
                    "glass_member_community",
                    JSON.stringify({ id: activeCommunity.id, slug: activeCommunity.slug, name: activeCommunity.name })
                  );
                } catch { /* ignore */ }
                navigate("/member/home");
                onCloseMobile?.();
                return;
              }
              const memberCommunity = communities.find((c) => !c.owned);
              if (memberCommunity) {
                // Set the active member community so Home loads the right one
                try {
                  localStorage.setItem(
                    "glass_member_community",
                    JSON.stringify({ id: memberCommunity.id, slug: memberCommunity.slug, name: memberCommunity.name })
                  );
                } catch { /* ignore */ }
                navigate("/member/home");
                onCloseMobile?.();
                return;
              }
              const pendingInvites = invites.filter((i) => (i.status ?? "").toUpperCase() === "PENDING");
              if (pendingInvites.length > 0) {
                navigate("/member/invites");
                onCloseMobile?.();
                return;
              }
              // Nothing actionable — show hint
              setMemberViewHint(true);
              setTimeout(() => setMemberViewHint(false), 3500);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 10px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "#6b7280",
              fontWeight: 500,
              fontSize: 12,
              transition: "all .15s",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#002FA7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}
          >
            <Smartphone size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left" }}>Member View</span>
          </button>

          {memberViewHint && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% - 4px)",
              left: 8,
              right: 8,
              background: "#1f2937",
              color: "#f9fafb",
              fontSize: 11,
              lineHeight: 1.5,
              padding: "8px 10px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10,
              pointerEvents: "none",
            }}>
              Ask another admin to invite you to their community, then come back here.
              <div style={{
                position: "absolute",
                bottom: -5,
                left: 18,
                width: 10,
                height: 10,
                background: "#1f2937",
                transform: "rotate(45deg)",
                borderRadius: 2,
              }} />
            </div>
          )}
        </div>

        {/* Bottom — user info strip */}
        {!collapsed && (
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #eef0f8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#002FA7,#4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {user?.profileImage?.url ? (
                <img src={user.profileImage.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                userInitials
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,

                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userDisplayName}
              </p>
            </div>
          </div>
        )}
      </div>
      )}
      </div>
    </>
  );
}
