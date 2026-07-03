// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { LayoutDashboard, CreditCard, Users, Settings } from "lucide-react";

// const NAV = [
//   {
//     icon: <LayoutDashboard size={15} />,
//     label: "Dashboard",
//     id: "dashboard",
//     // Both admin variants live here — match either path
//     paths: ["/dashboard/admin", "/dashboard/paying-admin"],
//   },
//   {
//     icon: <CreditCard size={15} />,
//     label: "Payments",
//     id: "payments",
//     paths: ["/dashboard/payments"],
//   },
//   {
//     icon: <Users size={15} />,
//     label: "Members",
//     id: "members",
//     paths: ["/dashboard/members"],
//   },
//   {
//     icon: <Settings size={15} />,
//     label: "Settings",
//     id: "settings",
//     paths: ["/dashboard/settings"],
//   },
// ];

// const COMMUNITIES = [
//   { tag: "KC", name: "Kings College Alumni" },
//   { tag: "C1", name: "Community 1" },
// ];

// export default function Sidebar() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeCom, setActiveCom] = useState("KC");

//   // Check if current path matches any of the nav item's paths (exact or nested)
//   const activeId =
//     NAV.find((n) =>
//       n.paths.some(
//         (p) =>
//           location.pathname === p ||
//           location.pathname.startsWith(p + "/")
//       )
//     )?.id || "dashboard";

//   const community = COMMUNITIES.find((c) => c.tag === activeCom);

//   // Navigate to the first path for each nav item on click
//   const navTo = (item) => navigate(item.paths[0]);

//   return (
//     <div className="flex h-screen sticky top-0 z-60 flex-shrink-0">

//       {/* ── Blue rail ── */}
//       <div className="w-14 flex-shrink-0 bg-[#002FA7] flex flex-col items-center pt-3.5 pb-5">

//         {/* Logo */}
//         <button
//           onClick={() => navigate("/")}
//           className="mb-4 p-0 bg-transparent border-none cursor-pointer"
//           title="Go to landing page"
//         >
//           <img
//             src="/Glass.png"
//             alt="Glass"
//             className="w-6 h-6 object-contain brightness-0 invert block"
//             onError={(e) => {
//               e.target.style.display = "none";
//               e.target.nextSibling.style.display = "flex";
//             }}
//           />
//           <div className="hidden w-6 h-6 rounded-md bg-white/25 items-center justify-center text-white font-black text-sm">
//             G
//           </div>
//         </button>

//         {/* Home */}
//         <button
//           onClick={() => navigate("/dashboard/home")}
//           title="Your Communities"
//           className={`w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center mb-3 transition-all
//             ${
//               location.pathname === "/dashboard/home"
//                 ? "bg-white text-[#002FA7]"
//                 : "bg-white/15 text-white hover:bg-white/25"
//             }`}
//         >
//           <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
//             <path
//               d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
//               stroke="currentColor" strokeWidth="1.8"
//               strokeLinecap="round" strokeLinejoin="round"
//             />
//             <path
//               d="M9 21V12h6v9"
//               stroke="currentColor" strokeWidth="1.8"
//               strokeLinecap="round" strokeLinejoin="round"
//             />
//           </svg>
//         </button>

//         <div className="w-5 h-px bg-white/20 mb-3.5" />

//         {/* Community avatars */}
//         <div className="flex flex-col gap-2 items-center">
//           {COMMUNITIES.map((c) => (
//             <button
//               key={c.tag}
//               onClick={() => {
//                 setActiveCom(c.tag);
//                 navigate("/dashboard/admin");
//               }}
//               title={c.name}
//               className={`w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center font-extrabold text-[11px] transition-all
//                 ${
//                   activeCom === c.tag
//                     ? "bg-white text-[#002FA7]"
//                     : "bg-white/15 text-white hover:bg-white/30"
//                 }`}
//             >
//               {c.tag}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── White nav panel ── */}
//       <div className="bg-white border-r border-[#eef0f8] flex flex-col overflow-hidden w-[220px]">

//         {/* Org header */}
//         <div className="flex items-center gap-2 px-3 py-3.5 border-b border-[#eef0f8] min-h-[56px]">
//           <p className="text-[11px] font-semibold text-[#000000] truncate leading-tight flex-1 min-w-0">
//             {community?.name}
//             <span className="inline-block ml-2 text-[8px] font-bold text-[#e85d04] bg-[#fff4ee] rounded-full px-2 py-px">
//               Admin
//             </span>
//           </p>
//         </div>

//         {/* Nav */}
//         <nav className="flex-1 px-2 py-2.5">
//           {NAV.map((item) => {
//             const isActive = item.id === activeId;
//             return (
//               <button
//                 key={item.id}
//                 onClick={() => navTo(item)}
//                 className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-none cursor-pointer text-[11px] font-medium mb-0.5 whitespace-nowrap transition-all
//                   ${
//                     isActive
//                       ? "bg-[#e6eeff] text-[#002FA7] font-semibold"
//                       : "text-gray-500 bg-transparent hover:bg-gray-50 hover:text-gray-700"
//                   }`}
//               >
//                 {item.icon}
//                 <span>{item.label}</span>
//               </button>
//             );
//           })}
//         </nav>
//       </div>
//     </div>
//   );
// }

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
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
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
  { icon: Bell,            label: "Notifications", segment: "notifications", path: "notifications", global: true },
  { icon: Settings,        label: "Settings",      segment: "settings",      path: "settings",      global: true },
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
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "";
  const userInitials = (user?.firstName || user?.lastName)
    ? `${(user?.firstName ?? "")[0] ?? ""}${(user?.lastName ?? "")[0] ?? ""}`.toUpperCase()
    : (user?.email ?? "").slice(0, 2).toUpperCase() || "?";

  const { data: communitiesData, isLoading: loading } = useCommunities();
  const communities = communitiesData?.communities ?? [];
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  return (
    <div className="flex h-screen sticky top-0 z-40 flex-shrink-0">
      {/* ── Blue rail ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-[#002FA7] flex flex-col items-center pt-3.5 pb-5"
        style={{ width: 56 }}
      >
        {/* Logo — goes to communities overview */}
        <button
          onClick={() => navigate("/dashboard/home")}
          className="mb-4 p-0 bg-transparent border-none cursor-pointer"
          title="Your Communities"
        >
          <img
            src="/Glass.png"
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
          onClick={() => navigate("/dashboard/home")}
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
          ) : communities.length === 0 ? (
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white/40 text-[10px]">—</span>
            </div>
          ) : (
            communities.map((c) => {
              const isActive = c.slug === urlSlug;
              const initials = getInitials(c.name);
              return (
                <button
                  key={c.id}
                  onClick={async () => {
                    localStorage.setItem("glass_community", JSON.stringify(c));
                    const isPaying = await resolveIsPayingAdmin(c.slug);
                    navigate(communityPath(c.slug, "admin", isPaying));
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

        {/* Logout button pinned to bottom of rail */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Log out"
          className="mt-4 w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
        </button>
      </div>

      {/* ── White nav panel ────────────────────────────────────────────────── */}
      <div
        style={{
          width: W,
          background: "#fff",
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
                  color: "#0f1d6e",
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
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {NAV.map(({ icon: Icon, label, segment, path, global: isGlobal }) => {
            const isActive = activeSegment === segment;
            // Global pages (Notifications, Settings) always resolve regardless
            // of whether a community is selected
            const href = isGlobal
              ? `/dashboard/${path}`
              : activeCommunity
                ? communityPath(activeCommunity.slug, path, activeCommunityIsPaying)
                : segment === "home"
                  ? "/dashboard/home"
                  : null;
            const isDisabled = !href;
            const badge = segment === "notifications" && unreadCount > 0 ? unreadCount : 0;

            return (
              <button
                key={segment}
                onClick={() => href && navigate(href)}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "none",
                  cursor: isDisabled ? "default" : "pointer",
                  background: isActive ? "#e6eeff" : "transparent",
                  color: isActive ? "#002FA7" : isDisabled ? "#d1d5db" : "#6b7280",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  marginBottom: 2,
                  transition: "all .15s",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                  opacity: isDisabled ? 0.5 : 1,
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
                <span style={{ flex: 1 }}>{label}</span>
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
    </div>
  );
}
