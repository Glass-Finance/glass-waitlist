import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, Shield, Bell, CreditCard, RefreshCw, Users, LogOut } from "lucide-react";
import { useAuth } from "../../../store/AuthContext";
import GlassLogoGlow from "../../../components/common/GlassLogoGlow";

const SECTIONS = [
  {
    label: "Account",
    items: [
      { Icon: User, label: "Profile", desc: "Your name, email and phone number", to: "/member/profile" },
      { Icon: Shield, label: "Security", desc: "Password and login protection", to: "/member/security" },
      { Icon: Bell, label: "Notifications", desc: "What you get notified about", to: "/member/notification-settings" },
    ],
  },
  {
    label: "Payments",
    items: [
      { Icon: CreditCard, label: "Payment Methods", desc: "Saved banks and auto-pay methods", to: "/member/saved-cards" },
      { Icon: RefreshCw, label: "Auto-Pay", desc: "Plans set to charge automatically", to: "/member/auto-pay" },
    ],
  },
  {
    label: "Community",
    items: [
      { Icon: Users, label: "My Communities", desc: "Communities you belong to", to: "/member/communities" },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/sign-in");
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
         
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
      }}
    >
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Settings</h1>
      </div>

      <div className="px-4">
        {SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#999", margin: "0 4px 8px", textTransform: "uppercase", letterSpacing: 0.4 }}>
              {section.label}
            </p>
            <div className="border border-surface-container-border" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              {section.items.map(({ Icon, label, desc, to }, i) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                    padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
                    borderBottom: i < section.items.length - 1 ? "1px solid #F2F2F2" : "none",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} className="text-[#1C2B8A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>{desc}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "#ccc", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="border border-surface-container-border"
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
            padding: "14px 16px", background: "#fff", borderRadius: 14,
            cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          <LogOut size={16} className="text-brand" />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#002FA7" }}>Log Out</span>
        </button>
      </div>
    </div>
  );
}
