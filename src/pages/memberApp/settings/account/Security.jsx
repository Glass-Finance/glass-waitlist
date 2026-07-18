import { useNavigate } from "react-router-dom";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { ChevronLeft, ChevronRight, Lock, ShieldCheck } from "lucide-react";

const ITEMS = [
  { Icon: Lock, label: "Password", desc: "Change your account password", to: "/member/security/password" },
  { Icon: ShieldCheck, label: "Multi-Factor Authentication", desc: "Secure your account with an authenticator app", to: "/member/security/authentication" },
];

export default function Security() {
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh",  fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Security</h1>
      </div>

      <div className="px-4">
        <div className="border border-surface-container-border" style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {ITEMS.map(({ Icon, label, desc, to }, i) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
                borderBottom: i < ITEMS.length - 1 ? "1px solid #F2F2F2" : "none",
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
    </div>
  );
}
