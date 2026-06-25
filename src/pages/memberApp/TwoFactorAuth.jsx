import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

function DisabledToggle() {
  return (
    <div style={{ width: 40, height: 22, borderRadius: 999, background: "#E0E0E0", position: "relative", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: 3 }} />
    </div>
  );
}

export default function TwoFactorAuth() {
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
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Authentication</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderBottom: "1px solid #F2F2F2" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>Two-Factor Authentication</p>
              <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>Require a code from an app at login</p>
            </div>
            <DisabledToggle />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>SMS Verification</p>
              <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>Require a code sent to your phone</p>
            </div>
            <DisabledToggle />
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#999", margin: "14px 4px 0", lineHeight: 1.5 }}>
          Two-factor authentication setup is coming soon.
        </p>
      </div>
    </div>
  );
}
