import { useMemo } from "react";
import { usePayments, useManagePayments } from "../../../../hooks/usePayments";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
    >
      <div className={`relative w-8 h-[20px] rounded-full transition-all duration-300 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}>
        <div className={`absolute top-0.75 w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[16px]" : "left-0.5"}`} />
      </div>
      <span className={`text-xs font-medium ${on ? "text-gray-600" : "text-gray-400"}`}>{on ? "On" : "Off"}</span>
    </button>
  );
}

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount ?? 0).replace("NGN", "₦");
}

export default function AutoPay() {
  const { data, isLoading: paymentsLoading } = usePayments();
  const { data: authorisations, isLoading: authsLoading, toggleAutoPay } = useManagePayments();

  const recurringPlans = useMemo(() => {
    const plans = (data?.upcoming ?? []).filter((o) => o.type === "recurring");
    // De-dupe by plan name + community (obligations recur per cycle)
    const seen = new Map();
    for (const p of plans) {
      const key = `${p.name}__${p.communityName}`;
      if (!seen.has(key)) seen.set(key, p);
    }
    return [...seen.values()];
  }, [data]);

  function findAuthForPlan(plan) {
    for (const auth of authorisations) {
      const consent = auth.consents.find(
        (c) => !c.revoked && c.paymentLinkTitle === plan.name && c.communityName === plan.communityName
      );
      if (consent) return auth;
    }
    return null;
  }

  function handleToggle(plan, auth) {
    if (!auth) return; // nothing to turn on without going through a real payment first
    if (!window.confirm(
      "Turning this off removes the saved payment method for this plan — auto-pay will stop for every plan tied to it."
    )) return;
    if (typeof pendo !== "undefined") {
      pendo.track("auto_pay_disabled", {
        plan_name: plan.name,
        community_name: plan.communityName,
      });
    }
    toggleAutoPay(auth.id, false);
  }

  const isLoading = paymentsLoading || authsLoading;

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">
      <div>
        <p className="text-xs font-medium text-gray-900 mb-0.5">Auto-Pay plans</p>
        <p className="text-xs text-gray-500">
          Manage automatic payments for your personal dues across all communities.
        </p>
      </div>
      <div className="bg-[#f6f6f8] rounded-lg p-6" style={{ border: "1px solid #f6f6f8" }}>
        <div className="flex flex-col">
          {isLoading ? (
            <p className="text-xs text-gray-400 py-4">Loading…</p>
          ) : recurringPlans.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">You're not on any recurring plans yet.</p>
          ) : (
            recurringPlans.map((plan) => {
              const auth = findAuthForPlan(plan);
              return (
                <div key={`${plan.name}-${plan.communityName}`} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plan.communityName} · {formatNaira(plan.amount)} · Next due {plan.dueDate ? new Date(plan.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}
                    </p>
                  </div>
                  <Toggle on={!!auth} onChange={() => handleToggle(plan, auth)} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-md" style={{ background: "#D7E2FF", border: "1px solid #002FA7" }}>
        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border border-[#002FA7]">
          <span className="text-[#002FA7] text-[9px] font-bold">i</span>
        </div>
        <p className="text-xs text-gray-700">
          Auto-Pay charges your default card on the due date. You'll receive a notification 3 days before each charge.
        </p>
      </div>
    </div>
  );
}
