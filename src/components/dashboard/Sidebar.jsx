import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, Users, Settings } from "lucide-react";

const NAV = [
  {
    icon: <LayoutDashboard size={15} />,
    label: "Dashboard",
    id: "dashboard",
    // Both admin variants live here — match either path
    paths: ["/dashboard/admin", "/dashboard/paying-admin"],
  },
  {
    icon: <CreditCard size={15} />,
    label: "Payments",
    id: "payments",
    paths: ["/dashboard/payments"],
  },
  {
    icon: <Users size={15} />,
    label: "Members",
    id: "members",
    paths: ["/dashboard/members"],
  },
  {
    icon: <Settings size={15} />,
    label: "Settings",
    id: "settings",
    paths: ["/dashboard/settings"],
  },
];

const COMMUNITIES = [
  { tag: "KC", name: "Kings College Alumni" },
  { tag: "C1", name: "Community 1" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCom, setActiveCom] = useState("KC");

  // Check if current path matches any of the nav item's paths (exact or nested)
  const activeId =
    NAV.find((n) =>
      n.paths.some(
        (p) =>
          location.pathname === p ||
          location.pathname.startsWith(p + "/")
      )
    )?.id || "dashboard";

  const community = COMMUNITIES.find((c) => c.tag === activeCom);

  // Navigate to the first path for each nav item on click
  const navTo = (item) => navigate(item.paths[0]);

  return (
    <div className="flex h-screen sticky top-0 z-60 flex-shrink-0">

      {/* ── Blue rail ── */}
      <div className="w-14 flex-shrink-0 bg-[#002FA7] flex flex-col items-center pt-3.5 pb-5">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="mb-4 p-0 bg-transparent border-none cursor-pointer"
          title="Go to landing page"
        >
          <img
            src="/Glass.png"
            alt="Glass"
            className="w-6 h-6 object-contain brightness-0 invert block"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="hidden w-6 h-6 rounded-md bg-white/25 items-center justify-center text-white font-black text-sm">
            G
          </div>
        </button>

        {/* Home */}
        <button
          onClick={() => navigate("/dashboard/home")}
          title="Your Communities"
          className={`w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center mb-3 transition-all
            ${
              location.pathname === "/dashboard/home"
                ? "bg-white text-[#002FA7]"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
              stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <path
              d="M9 21V12h6v9"
              stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="w-5 h-px bg-white/20 mb-3.5" />

        {/* Community avatars */}
        <div className="flex flex-col gap-2 items-center">
          {COMMUNITIES.map((c) => (
            <button
              key={c.tag}
              onClick={() => {
                setActiveCom(c.tag);
                navigate("/dashboard/admin");
              }}
              title={c.name}
              className={`w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center font-extrabold text-[11px] transition-all
                ${
                  activeCom === c.tag
                    ? "bg-white text-[#002FA7]"
                    : "bg-white/15 text-white hover:bg-white/30"
                }`}
            >
              {c.tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── White nav panel ── */}
      <div className="bg-white border-r border-[#eef0f8] flex flex-col overflow-hidden w-[220px]">

        {/* Org header */}
        <div className="flex items-center gap-2 px-3 py-3.5 border-b border-[#eef0f8] min-h-[56px]">
          <p className="text-[11px] font-semibold text-[#000000] truncate leading-tight flex-1 min-w-0">
            {community?.name}
            <span className="inline-block ml-2 text-[8px] font-bold text-[#e85d04] bg-[#fff4ee] rounded-full px-2 py-px">
              Admin
            </span>
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2.5">
          {NAV.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => navTo(item)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-none cursor-pointer text-[11px] font-medium mb-0.5 whitespace-nowrap transition-all
                  ${
                    isActive
                      ? "bg-[#e6eeff] text-[#002FA7] font-semibold"
                      : "text-gray-500 bg-transparent hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}