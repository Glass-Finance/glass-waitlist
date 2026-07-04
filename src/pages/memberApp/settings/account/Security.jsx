import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock, ShieldCheck } from "lucide-react";

const ITEMS = [
  { Icon: Lock, label: "Password", desc: "Change your account password", to: "/member/security/password" },
  { Icon: ShieldCheck, label: "Multi-Factor Authentication", desc: "Secure your account with an authenticator app", to: "/member/security/authentication" },
];

export default function Security() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Security</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
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
                <Icon size={16} style={{ color: "#1C2B8A" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
