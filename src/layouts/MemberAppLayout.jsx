import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, ArrowLeftRight, CalendarClock, Bell } from "lucide-react";

const TABS = [
  { to: "/member/home", label: "Home", Icon: Home },
  { to: "/member/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { to: "/member/upcoming", label: "Upcoming", Icon: CalendarClock },
  { to: "/member/notifications", label: "Notifications", Icon: Bell },
];

export default function MemberAppLayout() {
  const location = useLocation();

  return (
    <div className="flex justify-center items-start min-h-screen bg-[#EBEBEB]">
      <div
        className="relative flex flex-col bg-[#EBEBEB] w-full max-w-[390px] min-h-screen overflow-hidden"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: "80px" }}
        >
          <Outlet />
        </main>

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50"
          style={{
            background:
              "linear-gradient(180deg, rgba(235,235,235,0) 0%, #EBEBEB 28%)",
          }}
          aria-label="Main navigation"
        >
          <div
            className="mx-3 mb-3 rounded-2xl"
            style={{
              background: "#ffffff",
              boxShadow: "0 2px 20px rgba(0,0,0,0.10)",
            }}
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
                        className="relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200"
                        style={
                          isActive ? { background: "rgba(0,0,0,0.07)" } : {}
                        }
                      >
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.6}
                          className="transition-colors duration-200"
                          style={{
                            color: isActive ? "#111111" : "rgba(0,0,0,0.35)",
                          }}
                        />
                        {/* Active dot */}
                        {isActive && (
                          <span
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ background: "#111111" }}
                            aria-hidden="true"
                          />
                        )}
                      </span>

                      {/* Label */}
                      <span
                        className="text-[10px] leading-none tracking-wide transition-colors duration-200 select-none"
                        style={{
                          color: isActive ? "#111111" : "rgba(0,0,0,0.35)",
                          fontWeight: isActive ? 600 : 400,
                        }}
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
