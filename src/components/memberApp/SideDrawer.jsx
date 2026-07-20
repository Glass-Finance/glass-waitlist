import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  CreditCard,
  User,
  Settings,
  LogOut,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../store/AuthContext";

const NAV_ITEMS = [
  { Icon: HomeIcon, label: "Home", to: "/member/home" },
  { Icon: CreditCard, label: "Manage Payments", to: "/member/manage-payments" },
  { Icon: User, label: "Profile", to: "/member/profile" },
  { Icon: Settings, label: "Settings", to: "/member/settings" },
];

// Shared across the whole member app (rendered once by MemberAppLayout) so
// every page — not just Home — has a way to reach Settings/My Communities.
export default function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  async function handleLogout() {
    onClose();
    await logout();
    navigate("/member/app-sign-in", { replace: true });
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-[280ms] ease-[ease] ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[300px] z-50 bg-[#D9D9D9] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pt-5 px-5 pb-4">
          <div className="flex items-center gap-1.5">
            <div>
              <img
                src="/Glass.webp"
                alt="Glass"
                className="w-[30px] h-[30px]"
              />
            </div>
            <span className="text-lg font-medium text-[#111]">
              Glass
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="bg-transparent border-none cursor-pointer p-1 text-[#555]"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="h-px bg-[#0000000D] mx-0 my-0" />

        {/* Nav */}
        <nav className="flex-1 pt-2 px-4 pb-2 flex flex-col gap-1">
          {NAV_ITEMS.map(({ Icon, label, to }) => (
            <button
              key={label}
              onClick={() => {
                onClose();
                navigate(to);
              }}
              className="flex items-center gap-3 py-3.5 px-3 rounded-xl border-none bg-transparent cursor-pointer w-full text-left"
            >
              <Icon size={20} strokeWidth={1.6} className="text-[#444]" />
              <span className="text-[15px] font-normal text-[#222]">
                {label}
              </span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="h-px bg-[#0000000D] my-1 mx-0" />
              <button
                onClick={() => { onClose(); navigate("/dashboard/home"); }}
                className="flex items-center gap-3 py-3.5 px-3 rounded-xl border-none bg-transparent cursor-pointer w-full text-left"
              >
                <LayoutDashboard size={20} strokeWidth={1.6} className="text-brand" />
                <span className="text-[15px] font-normal text-brand">
                  Admin Dashboard
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Log out — pinned to bottom */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 pt-5 px-6 border-none bg-transparent cursor-pointer text-left outline-none pb-[max(env(safe-area-inset-bottom,0px)_+_32px,56px)]"
        >
          <LogOut size={18} strokeWidth={1.8} className="text-[#D32F2F]" />
          <span className="text-[15px] font-medium text-[#D32F2F]">
            Log Out
          </span>
        </button>
      </div>
    </>
  );
}
