import { useRef, useState } from "react";
import { useNavigate, useLocation, Outlet, Navigate } from "react-router-dom";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { Search, ChevronRight } from "lucide-react";
import { useAuth } from "../../../store/AuthContext";

const SUPER_ADMIN_EMAIL = "glasspayhq@gmail.com";

const TABS = [
  { label: "Account",   defaultPath: "/dashboard/settings/account",                  match: "account"   },
  { label: "Finance",   defaultPath: "/dashboard/settings/finance",                  match: "finance"   },
  { label: "Community", defaultPath: "/dashboard/settings/community",                match: "community" },
];

const ACCOUNT_ITEMS = [
  { label: "Profile",       desc: "Configure your details to how you want them to appear on Glass.", path: "/dashboard/settings/account/profile"       },
  { label: "My Role",       desc: "Tell us how you participate financially in this community.",       path: "/dashboard/settings/account/role"          },
  { label: "Security",      desc: "Keep your account locked down with password and login controls.",  path: "/dashboard/settings/account/security"      },
  { label: "Notifications", desc: "Choose which updates you get by email and SMS.",                   path: "/dashboard/settings/account/notifications" },
];

// Finance tab menu items
const FINANCE_ITEMS = [
  { label: "Payment Methods",  desc: "The cards and accounts Glass uses to collect your dues.",        path: "/dashboard/settings/finance/payment-methods"  },
  { label: "Auto-Pay",         desc: "Turn on automatic charging so you never miss a due date.",       path: "/dashboard/settings/finance/auto-pay"          },
  { label: "Payout Account",   desc: "The account your community's collected dues are settled into.",  path: "/dashboard/settings/finance/paystack"          },
];

const COMMUNITY_ITEMS = [
  { label: "Community Profile", desc: "How your community looks and behaves to its members.",           path: "/dashboard/settings/community/profile"        },
  { label: "Member Access",     desc: "Control who can join, and who else can manage this community.",  path: "/dashboard/settings/community/member-access"  },
];


const BREADCRUMB_MAP = {
  "account/profile":          { parent: "Account",   child: "Profile"           },
  "account/role":             { parent: "Account",   child: "My role"           },
  "account/notifications":    { parent: "Account",   child: "Notifications"     },
  "account/security":         { parent: "Account",   child: "Security"          },
  "finance/payment-methods":  { parent: "Finance",   child: "Payment Methods"   },
  "finance/auto-pay":         { parent: "Finance",   child: "Auto-Pay"          },
  "finance/paystack":         { parent: "Finance",   child: "Payout Account"    },
  "community/profile":        { parent: "Community", child: "Community Profile" },
  "community/member-access":  { parent: "Community", child: "Member Access"     },
};

const PARENT_PATH = {
  Account:   "/dashboard/settings/account",
  Finance:   "/dashboard/settings/finance",
  Community: "/dashboard/settings/community",
};

// Flat index for search — label, description, path, and which tab it lives in
const ALL_SETTINGS = [
  ...ACCOUNT_ITEMS.map(i => ({ ...i, tab: "Account" })),
  ...FINANCE_ITEMS.map(i => ({ ...i, tab: "Finance" })),
  ...COMMUNITY_ITEMS.map(i => ({ ...i, tab: "Community" })),
];

// Parent breadcrumb crumb — click to go back to that tab's menu list.
function BreadcrumbParent({ parent }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(PARENT_PATH[parent])}
      className="text-gray-600 hover:text-gray-900 hover:underline bg-transparent border-none p-0 cursor-pointer text-sm"
    >
      {parent}
    </button>
  );
}

function MenuList({ items }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-3 max-w-3xl w-full">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => navigate(item.path)}
          className="w-full flex items-center justify-between px-5 py-4 bg-surface-container rounded-xl text-left hover:bg-gray-50 transition-all cursor-pointer border border-surface-container-border"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </div>
          <ChevronRight size={15} className="text-gray-400 flex-shrink-0 ml-4" />
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const path     = location.pathname;
  const { user } = useAuth();

  const titleKey = Object.keys(BREADCRUMB_MAP).find(k => path.includes(k));
  usePageTitle(titleKey ? BREADCRUMB_MAP[titleKey].child : "Settings");
  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

  // Super-admin only gets Security — redirect any other settings path there
  if (isSuperAdmin && !path.includes("account/security")) {
    return <Navigate to="/dashboard/settings/account/security" replace />;
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const activeTab = TABS.find(t => path.includes(t.match))?.label || "Account";

  const isAccountMenu   = path === "/dashboard/settings/account";
  const isFinanceMenu   = path === "/dashboard/settings/finance";
  const isCommunityMenu = path === "/dashboard/settings/community";

  const crumbKey   = Object.keys(BREADCRUMB_MAP).find(k => path.includes(k));
  const breadcrumb = crumbKey ? BREADCRUMB_MAP[crumbKey] : null;

  const q = searchQuery.trim().toLowerCase();
  const searchResults = q.length > 0
    ? ALL_SETTINGS.filter(
        s => s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
      )
    : [];

  function handleSearchSelect(item) {
    setSearchQuery("");
    setSearchOpen(false);
    navigate(item.path);
  }

  return (
    <div className="flex flex-col h-full px-4 py-6 md:px-8 md:py-8 overflow-y-auto">

      {/* Heading + Search */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-xs text-gray-500">A full picture of your community's financial activity.</p>
        </div>

        {/* Search with live results dropdown */}
        <div className="relative" ref={searchRef}>
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Find A Setting"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            className="pl-9 pr-4 py-2 rounded-md text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-brand transition-colors w-full max-w-[220px]"
            style={{ border: "1px solid #D0D0D0", background: "#fff" }}
          />

          {/* Dropdown results */}
          {searchOpen && searchResults.length > 0 && (
            <div
              className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-surface-container-border"
              style={{ width: 280 }}
            >
              {searchResults.map((item) => (
                <button
                  key={item.path}
                  onMouseDown={() => handleSearchSelect(item)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.tab} · {item.desc}</p>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {searchOpen && q.length > 0 && searchResults.length === 0 && (
            <div
              className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-50 px-4 py-3 border border-surface-container-border"
              style={{ width: 240 }}
            >
              <p className="text-xs text-gray-400">No settings match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar — hidden for super-admin */}
      {!isSuperAdmin && (
        <div
          className="flex gap-1 mb-6 bg-stacked-container rounded-md p-1 w-fit"
          style={{ border: "1px solid #fafafa" }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.defaultPath)}
                className={`px-6 py-2 text-[13px] rounded transition-all cursor-pointer border-none font-medium
                  ${isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Breadcrumb — only shown on sub-pages, hidden for super-admin */}
      {breadcrumb && !isSuperAdmin && (
        <p className="text-sm text-gray-500 mb-5">
          <BreadcrumbParent parent={breadcrumb.parent} />
          <span className="mx-2 text-gray-400">›</span>
          <span className="font-semibold text-gray-900">{breadcrumb.child}</span>
        </p>
      )}

      {/* Menu lists — hidden for super-admin (redirected to security above) */}
      {!isSuperAdmin && isAccountMenu   && <MenuList items={ACCOUNT_ITEMS}   />}
      {!isSuperAdmin && isFinanceMenu   && <MenuList items={FINANCE_ITEMS}   />}
      {!isSuperAdmin && isCommunityMenu && <MenuList items={COMMUNITY_ITEMS} />}

      {/* Sub-page content */}
      {(isSuperAdmin || (!isAccountMenu && !isFinanceMenu && !isCommunityMenu)) && <Outlet />}
    </div>
  );
}