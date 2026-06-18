import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import GlassLogo from "../assets/Glass.png";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

const NAV = [
  {
    to: "/dashboard/home",
    label: "Dashboard",
    icon: <LayoutDashboard size={17} />,
  },
  {
    to: "/dashboard/payments",
    label: "Payments",
    icon: <CreditCard size={17} />,
  },
  { to: "/dashboard/members", label: "Members", icon: <Users size={17} /> },
  {
    to: "/dashboard/settings",
    label: "Settings",
    icon: <Settings size={17} />,
  },
];

function Avatar({ name, size = "sm" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sz} rounded-full bg-white/20 text-white flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F0F0F2]">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
