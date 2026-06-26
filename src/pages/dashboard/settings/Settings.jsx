// import { useNavigate, useLocation, Outlet } from "react-router-dom";
// import { Search } from "lucide-react";
// import Background from "../../../assets/background.png";

// const TABS = [
//   {
//     label: "Account",
//     defaultPath: "/dashboard/settings/account/profile",
//     match: "account",
//   },
//   {
//     label: "Finance",
//     defaultPath: "/dashboard/settings/finance/payment-method",
//     match: "finance",
//   },
//   {
//     label: "Community",
//     defaultPath: "/dashboard/settings/community/profile",
//     match: "community",
//   },
// ];

// export default function Settings() {
//   const navigate  = useNavigate();
//   const location  = useLocation();
//   const path      = location.pathname;

//   const activeTab = TABS.find(t => path.includes(t.match))?.label || "Account";

//   // Breadcrumb
//   const breadcrumbMap = {
//     "account/profile":       { parent: "Account", child: "Profile"       },
//     "account/role":          { parent: "Account", child: "My role"       },
//     "account/notifications": { parent: "Account", child: "Notifications" },
//     "account/security":      { parent: "Account", child: "Security"      },
//     "finance/payment-method":{ parent: "Finance", child: "Payment Method"},
//     "finance/auto-pay":      { parent: "Finance", child: "Auto-Pay"      },
//     "community":             { parent: "Finance", child: "Community"     },
//   };

//   const crumbKey   = Object.keys(breadcrumbMap).find(k => path.includes(k));
//   const breadcrumb = crumbKey ? breadcrumbMap[crumbKey] : null;

//   return (
//     <div className="flex flex-col h-full px-8 py-8 overflow-y-auto" style={{ backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}>

//       {/* Heading + Search */}
//       <div className="flex items-start justify-between mb-5">
//         <div>
//           <h1 className="text-lg font-bold text-gray-900 mb-1">Settings</h1>
//           <p className="text-xs text-gray-500">A full picture of your community's financial activity.</p>
//         </div>
//         <div className="relative">
//           <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Find A Setting"
//             className="pl-9 pr-4 py-2 rounded-md text-xs  text-gray-700 placeholder-gray-400 outline-none w-90"
//             style={{ border: "1px solid"}}
//           />
//         </div>
//       </div>

//       {/* Tab bar */}
//       <div className="flex gap-1 mb-6 bg-[#EFEFF1] rounded-md p-1 w-fit" style={{ border: "1px solid #fafafa" }}>
//         {TABS.map(tab => {
//           const isActive = activeTab === tab.label;
//           return (
//             <button
//               key={tab.label}
//               onClick={() => navigate(tab.defaultPath)}
//               className={`px-6 py-2 text-[13px] transition-all cursor-pointer border-none
//                 ${isActive ? "bg-[#FFFFFF] " : "bg-transparent  hover:text-gray-900"}`}
//             >
//               {tab.label}
//             </button>
//           );
//         })}
//       </div>

//       {/* Breadcrumb */}
//       {breadcrumb && (
//         <p className="text-sm text-gray-500 mb-6">
//           <span className="text-gray-600">{breadcrumb.parent}</span>
//           <span className="mx-2 text-gray-400">›</span>
//           <span className="font-semibold text-gray-900">{breadcrumb.child}</span>
//         </p>
//       )}

//       {/* Page content */}
//       <Outlet />
//     </div>
//   );
// }



import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import Background from "../../../assets/background.png";

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
  Account: "/dashboard/settings/account",
  Finance: "/dashboard/settings/finance",
  Community: "/dashboard/settings/community",
};

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
          className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-xl text-left hover:bg-gray-50 transition-all cursor-pointer border-none"
          style={{ border: "1px solid #E5E7EB" }}
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

  const activeTab = TABS.find(t => path.includes(t.match))?.label || "Account";

  // Determine if we're on the top-level tab (show menu) vs a sub-page (show Outlet)
  const isAccountMenu   = path === "/dashboard/settings/account";
  const isFinanceMenu   = path === "/dashboard/settings/finance";
  const isCommunityMenu = path === "/dashboard/settings/community";

  // Breadcrumb — only on sub-pages
  const crumbKey   = Object.keys(BREADCRUMB_MAP).find(k => path.includes(k));
  const breadcrumb = crumbKey ? BREADCRUMB_MAP[crumbKey] : null;

  return (
    <div
      className="flex flex-col h-full px-8 py-8 overflow-y-auto"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

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
            className="pl-9 pr-4 py-2 rounded-md text-xs text-gray-700 placeholder-gray-400 "
            style={{ border: "1px solid #000000", width: "220px" }}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 bg-[#EFEFF1] rounded-md p-1 w-fit"
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

      {/* Breadcrumb — only shown on sub-pages */}
      {breadcrumb && (
        <p className="text-sm text-gray-500 mb-5">
          <BreadcrumbParent parent={breadcrumb.parent} />
          <span className="mx-2 text-gray-400">›</span>
          <span className="font-semibold text-gray-900">{breadcrumb.child}</span>
        </p>
      )}

      {/* Menu lists — shown when on top-level tab, before drilling into a sub-page */}
      {isAccountMenu   && <MenuList items={ACCOUNT_ITEMS}   />}
      {isFinanceMenu   && <MenuList items={FINANCE_ITEMS}   />}
      {isCommunityMenu && <MenuList items={COMMUNITY_ITEMS} />}

      {/* Sub-page content — rendered for all sub-routes */}
      {!isAccountMenu && !isFinanceMenu && !isCommunityMenu && <Outlet />}
    </div>
  );
}