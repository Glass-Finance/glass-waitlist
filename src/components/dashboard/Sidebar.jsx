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
import { resolveIsPayingAdmin, isCommunityAdmin } from "../../utils/communityRole";

// ─── Nav items ────────────────────────────────────────────────────────────────
// `path` is the route under /dashboard; "home" maps to the per-community
// admin dashboard ("admin"), which keeps its own URL convention
// (?community=slug — see AdminDashboard.jsx) distinct from the
// /dashboard/home communities-overview page.
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     segment: "home",          path: "admin" },
  { icon: CreditCard,      label: "Payments",      segment: "payments",      path: "payments" },
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
// AdminDashboard.jsx / CommunitiesHome.jsx — "settings" is genuinely
// account-level (profile/security), so it doesn't need it. Notifications
// used to be exempted here too on the assumption it was also global, but
// it isn't -- each community's Notifications page is meant to show only
// that community's own notifications (the cross-community view lives
// solely in the topbar bell dropdown). Dropping ?community= here made the
// sidebar's own already-resolved active community silently invisible to
// the page it linked to, which fell back to a localStorage snapshot that
// isn't guaranteed to match whatever community is actually on screen —
// reliably reproducing "notifications page shows every community" even
// after Notifications.jsx itself was fixed to respect an active community
// when one is passed to it.
// "admin" has two variants (AdminDashboard.jsx's two exports) depending on
// whether this admin pays dues as a member of their own community — isPaying
// has to be resolved by the caller (see resolveIsPayingAdmin) since it's
// per-community, not derivable from the slug alone.
function communityPath(slug, path, isPaying = false) {
  if (path === "settings") return `/dashboard/${path}`;
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
        <div className="flex-shrink-0 bg-brand flex flex-col items-center pt-3.5 pb-5 w-14">
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
          className="bg-white md:bg-surface-container md:border-r md:border-surface-container-border w-[220px] flex flex-col"
        >
          <div className="py-3.5 px-3 pb-[13px] border-b border-[var(--color-hairline)] min-h-14 flex items-center">
            <div>
              <div className="text-xs font-bold text-brand leading-[1.3]">
                Platform Admin
              </div>
              <span className="inline-block mt-[3px] text-[9px] font-bold text-[#7c3aed] bg-[#f5f3ff] rounded-full py-px px-[7px]">
                Super Admin
              </span>
            </div>
          </div>

          <nav className="flex-1 py-2.5 px-2">
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
                  className={`w-full flex items-center gap-2 py-2.5 px-2.5 rounded-lg border-none cursor-pointer tracking-normal text-xs whitespace-nowrap mb-1.5 transition-all duration-150 ${
                    isActive
                      ? "bg-brand-tint text-brand font-bold"
                      : "bg-transparent text-[#6b7280] font-medium hover:bg-[#f9fafb]"
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {badge > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="py-2.5 px-3 border-t border-[var(--color-hairline)] flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,#7c3aed,var(--color-brand))] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold m-0 whitespace-nowrap overflow-hidden text-ellipsis">
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
      <div className="flex-shrink-0 bg-brand flex flex-col items-center pt-3.5 pb-5 w-14">
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
              ? "bg-white text-brand"
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
          ) : communities.filter(isCommunityAdmin).length === 0 ? (
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white/40 text-[10px]">—</span>
            </div>
          ) : (
            // Role-based, not ownership-based: promoted ADMIN/MANAGER
            // members administer communities they don't own and need them
            // reachable from this rail too.
            communities.filter(isCommunityAdmin).map((c) => {
              const isActive = c.slug === urlSlug;
              const initials = getInitials(c.name);
              return (
                <div key={c.id} className="relative flex-shrink-0">
                  {/* Active indicator — a pill riding the rail's outer edge,
                      not a change to the tile itself. This is what actually
                      shows which community is selected; it shifts to sit
                      beside whichever tile is active instead of restyling
                      the tile (a restyled tile is what "ruins" a logo that
                      has its own white/colored background). */}
                  {isActive && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-white -left-2.5"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    onClick={async () => {
                      localStorage.setItem("glass_community", JSON.stringify(c));
                      const isPaying = await resolveIsPayingAdmin(c.slug);
                      navigate(communityPath(c.slug, "admin", isPaying));
                      onCloseMobile?.();
                    }}
                    title={c.name}
                    className={`w-9 h-9 rounded-xl border border-white/15 hover:border-white/30 cursor-pointer flex items-center justify-center font-extrabold text-[11px] transition-all select-none overflow-hidden flex-shrink-0 ${
                      c.logo?.url ? "" : "bg-white/15 text-white hover:bg-white/30"
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
                </div>
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
        className="bg-white md:bg-surface-container w-[220px] border-r border-surface-container-border flex flex-col overflow-hidden transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        {/* Org header */}
        <div className="py-3.5 px-3 pb-[13px] border-b border-[var(--color-hairline)] flex items-center justify-between gap-2 min-h-14">
          {activeCommunity ? (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-black whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]">
                {activeCommunity.name}
              </div>
              <span
                className={`inline-block mt-[3px] text-[9px] font-bold rounded-full py-px px-[7px] ${isCommunityAdmin(activeCommunity) ? "text-[#e85d04] bg-[#fff4ee]" : "text-[#059669] bg-[#ecfdf5]"}`}
              >
                {activeCommunity.owned
                  ? "Owner"
                  : isCommunityAdmin(activeCommunity)
                    ? "Admin"
                    : "Member"}
              </span>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-black leading-[1.3]">
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
        <nav data-tour="sidebar-nav" className="flex-1 py-2.5 px-2 overflow-y-auto">
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
                className={`w-full flex items-center gap-2 py-2.5 px-2.5 rounded-lg border-none tracking-normal text-xs mb-1.5 transition-all duration-150 whitespace-nowrap ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} ${
                  isActive
                    ? "bg-brand-tint text-brand font-bold"
                    : isDisabled
                      ? "bg-transparent text-[#9ca3af] font-medium"
                      : "bg-transparent text-[#6b7280] font-medium hover:bg-[#f9fafb]"
                }`}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Member View switch */}
        <div className="px-2 pb-2 relative">
          <div className="h-px bg-[var(--color-hairline)] mb-2" />
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
            className="w-full flex items-center gap-2 py-2.5 px-2.5 rounded-lg border-none cursor-pointer bg-transparent text-[#6b7280] font-medium text-xs transition-all duration-150 whitespace-nowrap hover:bg-[#f9fafb] hover:text-brand"
          >
            <Smartphone size={14} className="flex-shrink-0" />
            <span className="flex-1 text-left">Member View</span>
          </button>

          {memberViewHint && (
            <div className="absolute left-2 right-2 bg-[#1f2937] text-[#f9fafb] text-[11px] leading-relaxed py-2 px-2.5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-10 pointer-events-none [bottom:calc(100%-4px)]">
              Ask another admin to invite you to their community, then come back here.
              <div className="absolute -bottom-[5px] left-[18px] w-2.5 h-2.5 bg-[#1f2937] rotate-45 rounded-sm" />
            </div>
          )}
        </div>

        {/* Bottom — user info strip */}
        {!collapsed && (
          <div className="py-2.5 px-3 border-t border-[var(--color-hairline)] flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,var(--color-brand),#4f46e5)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
              {user?.profileImage?.url ? (
                <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold m-0 whitespace-nowrap overflow-hidden text-ellipsis">
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
