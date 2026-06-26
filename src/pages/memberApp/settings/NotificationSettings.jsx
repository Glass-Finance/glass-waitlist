import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useNotificationPreferences } from "../../../hooks/useNotifications";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
    >
      <div style={{ width: 40, height: 22, borderRadius: 999, background: on ? "#002FA7" : "#D1D5DB", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s" }} />
      </div>
    </button>
  );
}

function Row({ label, desc, value, onChange, last = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderBottom: last ? "none" : "1px solid #F2F2F2" }}>
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>{desc}</p>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { preferences, isLoading, update } = useNotificationPreferences();
  const get = (key) => preferences[key] ?? true;

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Notifications</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        {isLoading && <p style={{ textAlign: "center", color: "#999", fontSize: 13 }}>Loading…</p>}

        <p style={{ fontSize: 12, fontWeight: 600, color: "#999", margin: "0 4px 8px", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Payment
        </p>
        <div style={{ background: "#fff", borderRadius: 14, padding: 4, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <Row label="Payment due reminder" desc="3 days before your dues are due" value={get("paymentDue")} onChange={(v) => update("paymentDue", v)} />
          <Row label="Payment successful" desc="Confirmation when a payment goes through" value={get("paymentSuccess")} onChange={(v) => update("paymentSuccess", v)} />
          <Row label="Payment failed" desc="Alert when a payment attempt fails" value={get("paymentFailed")} onChange={(v) => update("paymentFailed", v)} />
          <Row label="Auto-Pay charged" desc="Confirmation when Auto-Pay processes a charge" value={get("autoPay")} onChange={(v) => update("autoPay", v)} last />
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: "#999", margin: "0 4px 8px", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Community
        </p>
        <div style={{ background: "#fff", borderRadius: 14, padding: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <Row label="New member joined" desc="When someone joins your community" value={get("newMember")} onChange={(v) => update("newMember", v)} />
          <Row label="New payment plan" desc="When a new plan is added to your community" value={get("newPlan")} onChange={(v) => update("newPlan", v)} last />
        </div>
      </div>
    </div>
  );
}
