import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Search } from "lucide-react";

const TABS = [
  { label: "Account", base: "/dashboard/settings/account" },
  { label: "Finance", base: "/dashboard/settings/finance" },
  { label: "Community", base: "/dashboard/settings/community" },
];

const ACCOUNT_LINKS = [
  { to: "/dashboard/settings/account/profile", label: "Profile" },
  { to: "/dashboard/settings/account/role", label: "My role" },
  { to: "/dashboard/settings/account/notifications", label: "Notifications" },
  { to: "/dashboard/settings/account/security", label: "Security" },
];

const FINANCE_LINKS = [
  { to: "/dashboard/settings/finance/payment-method", label: "Payment Method" },
  { to: "/dashboard/settings/finance/auto-pay", label: "Auto-Pay" },
];

const COMMUNITY_LINKS = [
  { to: "/dashboard/settings/community/profile", label: "Community" },
];

export default function Settings() {
  const location = useLocation();

  const activeTab = location.pathname.includes("/finance")
    ? "Finance"
    : location.pathname.includes("/community")
    ? "Community"
    : "Account";

  const subLinks =
    activeTab === "Finance"
      ? FINANCE_LINKS
      : activeTab === "Community"
      ? COMMUNITY_LINKS
      : ACCOUNT_LINKS;

  // Breadcrumb
  const allLinks = [...ACCOUNT_LINKS, ...FINANCE_LINKS, ...COMMUNITY_LINKS];
  const activeLink = allLinks.find((l) => location.pathname.startsWith(l.to));

  return (
    <div className="px-8 py-8 h-full flex flex-col">

      {/* Heading + Search */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-500">A full picture of your community's financial activity.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Find A Setting"
            className="pl-9 pr-4 py-2 rounded-xl text-sm bg-white text-gray-700 placeholder-gray-400 outline-none w-52"
            style={{ border: "1px solid #E5E7EB" }}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 w-fit" style={{ border: "1px solid #E5E7EB" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.label;
          const firstLink =
            tab.label === "Finance"
              ? FINANCE_LINKS[0].to
              : tab.label === "Community"
              ? COMMUNITY_LINKS[0].to
              : ACCOUNT_LINKS[0].to;
          return (
            <NavLink
              key={tab.label}
              to={firstLink}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive ? "bg-[#002FA7] text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {/* Breadcrumb */}
      {activeLink && (
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-700">{activeTab}</span>
          <span className="mx-2 text-gray-400">›</span>
          <span className="font-semibold text-gray-900">{activeLink.label}</span>
        </p>
      )}

      {/* Sub-nav + content */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Sub nav — only shown when there are multiple links */}
        {subLinks.length > 1 && (
          <aside className="w-44 flex-shrink-0">
            {subLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-all
                  ${isActive ? "bg-blue-50 text-[#002FA7]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </aside>
        )}

        {/* Page outlet */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}