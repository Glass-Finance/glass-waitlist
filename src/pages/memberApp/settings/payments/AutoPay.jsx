import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { usePayments, useManagePayments } from "../../../../hooks/usePayments";

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

function formatNaira(amount) {
  return "₦" + new Intl.NumberFormat("en-NG").format(amount ?? 0);
}

export default function AutoPay() {
  const navigate = useNavigate();
  const { data, isLoading: paymentsLoading } = usePayments();
  const { data: authorisations, isLoading: authsLoading, toggleAutoPay } = useManagePayments();

  const recurringPlans = useMemo(() => {
    const plans = (data?.upcoming ?? []).filter((o) => o.type === "recurring");
    const seen = new Map();
    for (const p of plans) {
      const key = `${p.name}__${p.communityName}`;
      if (!seen.has(key)) seen.set(key, p);
    }
    return [...seen.values()];
  }, [data]);

  function findAuthForPlan(plan) {
    for (const auth of authorisations ?? []) {
      const consent = auth.consents.find(
        (c) => !c.revoked && c.paymentLinkTitle === plan.name && c.communityName === plan.communityName
      );
      if (consent) return auth;
    }
    return null;
  }

  function handleToggle(auth) {
    if (!auth) return;
    if (!window.confirm("Turning this off removes the saved payment method for this plan — auto-pay will stop for every plan tied to it.")) return;
    toggleAutoPay(auth.id, false);
  }

  const isLoading = paymentsLoading || authsLoading;

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Auto-Pay</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "20px 0" }}>Loading…</p>
          ) : recurringPlans.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "20px 0" }}>
              You're not on any recurring plans yet.
            </p>
          ) : (
            recurringPlans.map((plan, i) => {
              const auth = findAuthForPlan(plan);
              return (
                <div
                  key={`${plan.name}-${plan.communityName}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px",
                    borderBottom: i < recurringPlans.length - 1 ? "1px solid #F2F2F2" : "none",
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{plan.name}</p>
                    <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
                      {plan.communityName} · {formatNaira(plan.amount)}
                    </p>
                  </div>
                  <Toggle on={!!auth} onChange={() => handleToggle(auth)} />
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#D7E2FF" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid #002FA7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#002FA7" }}>i</span>
          </div>
          <p style={{ fontSize: 12, color: "#333", margin: 0, lineHeight: 1.5 }}>
            Auto-Pay charges your saved method on the due date. You'll get a reminder 3 days before each charge.
          </p>
        </div>
      </div>
    </div>
  );
}
