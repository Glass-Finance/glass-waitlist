import { useMemo, useState } from "react";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { usePayments, useManagePayments, isAuthorisationExpired } from "../../../../hooks/usePayments";
import PageLoadingState from "../../../../components/common/PageLoadingState";
import EmptyState from "../../../../components/common/EmptyState";
import Toggle from "../../../../components/common/Toggle";
import ConfirmSheet from "../../../../components/common/ConfirmSheet";
import { formatNaira } from "../../../../utils/format";

export default function AutoPay() {
  const navigate = useNavigate();
  const { data, isLoading: paymentsLoading } = usePayments();
  const { data: authorisations, isLoading: authsLoading, toggleAutoPay, isRemoving } = useManagePayments();
  const [turningOff, setTurningOff] = useState(null); // { plan, auth }

  // Build a flat list of plans: all recurring upcoming obligations, deduped by plan ID
  const recurringPlans = useMemo(() => {
    const seen = new Map();
    for (const o of data?.upcoming ?? []) {
      if (o.type !== "recurring") continue;
      const key = o.paymentLinkId ?? `${o.name}__${o.communityName}`;
      if (!seen.has(key)) seen.set(key, o);
    }
    return [...seen.values()];
  }, [data]);

  // Authorisation plans — derived from consent entries (covers plans that
  // have auto-pay active but may no longer have a matching upcoming obligation)
  const authPlans = useMemo(() => {
    const seen = new Map();
    for (const auth of authorisations ?? []) {
      for (const c of auth.consents ?? []) {
        if (c.revoked) continue;
        const key = c.paymentLinkId ?? `${c.paymentLinkTitle}__${c.communityName}`;
        if (!seen.has(key)) {
          seen.set(key, {
            paymentLinkId: c.paymentLinkId,
            name: c.paymentLinkTitle ?? "Payment Plan",
            communityName: c.communityName ?? "",
            amount: null,
            auth,
          });
        }
      }
    }
    return [...seen.values()];
  }, [authorisations]);

  // Merge: prefer upcoming obligations, overlay auth info
  const allPlans = useMemo(() => {
    const result = new Map();
    // Seed with recurring obligations
    for (const p of recurringPlans) {
      const key = p.paymentLinkId ?? `${p.name}__${p.communityName}`;
      result.set(key, { ...p, auth: null });
    }
    // Overlay auth info
    for (const ap of authPlans) {
      const key = ap.paymentLinkId ?? `${ap.name}__${ap.communityName}`;
      if (result.has(key)) {
        result.get(key).auth = ap.auth;
      } else {
        result.set(key, ap);
      }
    }
    return [...result.values()];
  }, [recurringPlans, authPlans]);

  function findAuthForPlan(plan) {
    for (const auth of authorisations ?? []) {
      const consent = auth.consents.find((c) => {
        if (c.revoked) return false;
        // Match by ID first (most reliable), then fall back to title+community
        if (plan.paymentLinkId && c.paymentLinkId) return c.paymentLinkId === plan.paymentLinkId;
        return c.paymentLinkTitle === plan.name && c.communityName === plan.communityName;
      });
      if (consent) return auth;
    }
    return null;
  }

  function handleToggle(plan) {
    const auth = findAuthForPlan(plan);
    if (!auth) return; // can't disable what isn't enabled
    setTurningOff({ plan, auth });
  }

  const isLoading = paymentsLoading || authsLoading;

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", background: "var(--color-surface-bg)", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <GlassLogoGlow />
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
        {allPlans.length > 0 && (
          <p style={{ fontSize: 12, fontWeight: 600, color: "#999", margin: "0 4px 8px", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Active Plans
          </p>
        )}
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {isLoading ? (
            <PageLoadingState size={56} padding="36px 24px" />
          ) : allPlans.length === 0 ? (
            <EmptyState icon={RefreshCw} title="You're not on any recurring plans yet" className="py-5" />
          ) : (
            allPlans.map((plan, i) => {
              const auth = findAuthForPlan(plan);
              const isOn = !!auth;
              const expired = auth ? isAuthorisationExpired(auth) : false;
              const inactive = auth && (auth.status ?? "").toUpperCase() !== "ACTIVE";
              return (
                <div
                  key={plan.paymentLinkId ?? `${plan.name}-${plan.communityName}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px",
                    borderBottom: i < allPlans.length - 1 ? "1px solid #F2F2F2" : "none",
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "#111", margin: 0 }}>{plan.name}</p>
                    <p style={{ fontSize: 13, color: "#999", margin: "3px 0 0" }}>
                      {[plan.communityName, plan.amount != null ? formatNaira(plan.amount) : null].filter(Boolean).join(" · ")}
                    </p>
                    {expired && (
                      <p style={{ fontSize: 11, color: "#DC2626", margin: "4px 0 0", lineHeight: 1.4 }}>
                        Your saved card expired
                        {auth.expMonth && auth.expYear ? ` ${auth.expMonth}/${auth.expYear}` : ""}.
                        Auto-Pay charges will fail — pay once with a new card to update it.
                      </p>
                    )}
                    {!expired && inactive && (
                      <p style={{ fontSize: 11, color: "#D97706", margin: "4px 0 0", lineHeight: 1.4 }}>
                        Your saved payment method is no longer active, so automatic
                        charges may fail. Pay once with a new method to re-enable Auto-Pay.
                      </p>
                    )}
                  </div>
                  <Toggle on={isOn} onChange={() => handleToggle(plan)} />
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
            Auto-Pay charges your saved method on each due date, and you'll get an
            in-app and email reminder 3 days before every charge. If a charge fails
            (an expired card, insufficient funds, or a declined transaction), the
            payment stays due and you'll be notified so you can pay manually.
          </p>
        </div>
      </div>

      {turningOff && (
        <ConfirmSheet
          title="Turn Off Auto-Pay?"
          description={`This removes the saved payment method for ${turningOff.plan.name} entirely — Auto-Pay will stop for every plan tied to that same method, not just this one.`}
          confirmLabel="Yes, turn off"
          confirmingLabel="Turning off…"
          confirming={isRemoving}
          onCancel={() => setTurningOff(null)}
          onConfirm={() =>
            toggleAutoPay(turningOff.auth.id, false, { onSuccess: () => setTurningOff(null) })
          }
        />
      )}
    </div>
  );
}
