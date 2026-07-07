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
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.25)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          zIndex: 50,
          background: "#D9D9D9",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div>
              <img
                src="/Glass.webp"
                alt="Glass"
                style={{ width: 30, height: 30 }}
              />
            </div>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#111" }}>
              Glass
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#555",
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div style={{ height: 1, background: "#0000000D", margin: "0 ", }} />

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "8px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map(({ Icon, label, to }) => (
            <button
              key={label}
              onClick={() => {
                onClose();
                navigate(to);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 12px",
                borderRadius: 12,
                border: "none",
                background: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <Icon size={20} strokeWidth={1.6} style={{ color: "#444" }} />
              <span style={{ fontSize: 15, fontWeight: 400, color: "#222" }}>
                {label}
              </span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div style={{ height: 1, background: "#0000000D", margin: "4px 0" }} />
              <button
                onClick={() => { onClose(); navigate("/dashboard/home"); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 12px",
                  borderRadius: 12,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <LayoutDashboard size={20} strokeWidth={1.6} style={{ color: "#002FA7" }} />
                <span style={{ fontSize: 15, fontWeight: 400, color: "#002FA7" }}>
                  Admin Dashboard
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Log out — pinned to bottom */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 24px",
            paddingBottom: `max(env(safe-area-inset-bottom, 0px) + 32px, 56px)`,
            border: "none",
            background: "none",
            cursor: "pointer",
            textAlign: "left",
            outline: "none",
          }}
        >
          <LogOut size={18} strokeWidth={1.8} style={{ color: "#D32F2F" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#D32F2F" }}>
            Log Out
          </span>
        </button>
      </div>
    </>
  );
}
