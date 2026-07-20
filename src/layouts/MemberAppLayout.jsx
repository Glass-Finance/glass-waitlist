import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, ArrowLeftRight, CalendarClock, Bell, Menu } from "lucide-react";
import SideDrawer from "../components/memberApp/SideDrawer";
import InvitePopup from "../components/memberApp/InvitePopup";

const TABS = [
  { to: "/member/home", label: "Home", Icon: Home },
  { to: "/member/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { to: "/member/upcoming", label: "Upcoming", Icon: CalendarClock },
  { to: "/member/notifications", label: "Notifications", Icon: Bell },
];

export default function MemberAppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex justify-center items-start min-h-screen bg-surface-bg">
      <div
        className="relative bg-surface-bg w-full max-w-[390px] min-h-screen bg-cover bg-center bg-no-repeat bg-mobile-auth-default"
      >
        {/* Content — window scrolls naturally; paddingBottom clears the fixed nav */}
        <main className="pb-[88px]">
          <Outlet />
        </main>

        {/* Invite popup — shown when the user has pending community invites */}
        <InvitePopup />

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-30 bg-[linear-gradient(180deg,rgba(249,249,251,0)_0%,var(--color-surface-bg)_28%)]"
          aria-label="Main navigation"
        >
          <div
            className="mx-3 mb-3 rounded-2xl bg-white border border-surface-container-border shadow-[0_2px_20px_rgba(0,0,0,0.1)]"
          >
            <ul className="flex items-center justify-around px-2 py-2">
              {TABS.map(({ to, label, Icon }) => {
                const isActive =
                  location.pathname === to ||
                  (to !== "/member/home" && location.pathname.startsWith(to));

                return (
                  <li key={to} className="flex-1">
                    <NavLink
                      to={to}
                      aria-label={label}
                      aria-current={isActive ? "page" : undefined}
                      className="flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all duration-200"
                    >
                      {/* Icon wrapper */}
                      <span
                        className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${isActive ? "bg-black/7" : ""}`}
                      >
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.6}
                          className={`transition-colors duration-200 ${isActive ? "text-[#111111]" : "text-black/35"}`}
                        />
                        {/* Active dot */}
                        {isActive && (
                          <span
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#111111]"
                            aria-hidden="true"
                          />
                        )}
                      </span>

                      {/* Label */}
                      <span
                        className={`text-[10px] leading-none tracking-wide transition-colors duration-200 select-none ${isActive ? "text-[#111111] font-semibold" : "text-black/35 font-normal"}`}
                      >
                        {label}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            {/* iOS home indicator spacer */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
          </div>
        </nav>
      </div>
    </div>
  );
}
