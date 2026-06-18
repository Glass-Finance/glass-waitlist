import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Search } from "lucide-react";
import Background from "../../../assets/background.png";

const TABS = [
  {
    label: "Account",
    defaultPath: "/dashboard/settings/account/profile",
    match: "account",
  },
  {
    label: "Finance",
    defaultPath: "/dashboard/settings/finance/payment-method",
    match: "finance",
  },
  {
    label: "Community",
    defaultPath: "/dashboard/settings/community/profile",
    match: "community",
  },
];

export default function Settings() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const path      = location.pathname;

  const activeTab = TABS.find(t => path.includes(t.match))?.label || "Account";

  // Breadcrumb
  const breadcrumbMap = {
    "account/profile":       { parent: "Account", child: "Profile"       },
    "account/role":          { parent: "Account", child: "My role"       },
    "account/notifications": { parent: "Account", child: "Notifications" },
    "account/security":      { parent: "Account", child: "Security"      },
    "finance/payment-method":{ parent: "Finance", child: "Payment Method"},
    "finance/auto-pay":      { parent: "Finance", child: "Auto-Pay"      },
    "community":             { parent: "Finance", child: "Community"     },
  };

  const crumbKey   = Object.keys(breadcrumbMap).find(k => path.includes(k));
  const breadcrumb = crumbKey ? breadcrumbMap[crumbKey] : null;

  return (
    <div className="flex flex-col h-full px-8 py-8 overflow-y-auto" style={{ backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}>

      {/* Heading + Search */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-xs text-gray-500">A full picture of your community's financial activity.</p>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Find A Setting"
            className="pl-9 pr-4 py-2 rounded-md text-xs  text-gray-700 placeholder-gray-400 outline-none w-90"
            style={{ border: "1px solid"}}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#EFEFF1] rounded-md p-1 w-fit" style={{ border: "1px solid #fafafa" }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.defaultPath)}
              className={`px-6 py-2 text-[13px] transition-all cursor-pointer border-none
                ${isActive ? "bg-[#FFFFFF] " : "bg-transparent  hover:text-gray-900"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Breadcrumb */}
      {breadcrumb && (
        <p className="text-sm text-gray-500 mb-6">
          <span className="text-gray-600">{breadcrumb.parent}</span>
          <span className="mx-2 text-gray-400">›</span>
          <span className="font-semibold text-gray-900">{breadcrumb.child}</span>
        </p>
      )}

      {/* Page content */}
      <Outlet />
    </div>
  );
}