import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import {
  usePayments,
  useManagePayments,
  isAuthorisationExpired,
} from "../../../../hooks/usePayments";
import LoadingState from "../../../../components/common/LoadingState";
import EmptyState from "../../../../components/common/EmptyState";
import Toggle from "../../../../components/common/Toggle";
import { formatNaira } from "../../../../utils/format";

export default function AutoPay() {
  const { data, isLoading: paymentsLoading } = usePayments();
  const { data: authorisations, isLoading: authsLoading, toggleAutoPay } = useManagePayments();

  // Recurring upcoming obligations, deduped by plan (obligations recur per cycle)
  const recurringPlans = useMemo(() => {
    const seen = new Map();
    for (const o of data?.upcoming ?? []) {
      if (o.type !== "recurring") continue;
      const key = o.paymentLinkId ?? `${o.name}__${o.communityName}`;
      if (!seen.has(key)) seen.set(key, o);
    }
    return [...seen.values()];
  }, [data]);

  // Plans derived from active consents — covers plans that have Auto-Pay
  // enabled but no currently-due obligation. Without these, an enrolled plan
  // between cycles would vanish from this list and couldn't be turned off.
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
            dueDate: null,
          });
        }
      }
    }
    return [...seen.values()];
  }, [authorisations]);

  // Merge: obligations carry amount/due date, consents fill in the rest
  const allPlans = useMemo(() => {
    const result = new Map();
    for (const p of recurringPlans) {
      const key = p.paymentLinkId ?? `${p.name}__${p.communityName}`;
      result.set(key, p);
    }
    for (const ap of authPlans) {
      const key = ap.paymentLinkId ?? `${ap.name}__${ap.communityName}`;
      if (!result.has(key)) result.set(key, ap);
    }
    return [...result.values()];
  }, [recurringPlans, authPlans]);

  function findAuthForPlan(plan) {
    for (const auth of authorisations ?? []) {
      const consent = (auth.consents ?? []).find((c) => {
        if (c.revoked) return false;
        // Match by ID first (most reliable), then fall back to title+community
        if (plan.paymentLinkId && c.paymentLinkId) return c.paymentLinkId === plan.paymentLinkId;
        return c.paymentLinkTitle === plan.name && c.communityName === plan.communityName;
      });
      if (consent) return auth;
    }
    return null;
  }

  function handleToggle(plan, auth) {
    if (!auth) return; // nothing to turn on without going through a real payment first
    if (!window.confirm(
      "Turning this off removes the saved payment method for this plan — auto-pay will stop for every plan tied to it."
    )) return;
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
            <LoadingState className="py-4" />
          ) : allPlans.length === 0 ? (
            <EmptyState icon={RefreshCw} title="You're not on any recurring plans yet" className="py-4" />
          ) : (
            allPlans.map((plan) => {
              const auth = findAuthForPlan(plan);
              const expired = auth ? isAuthorisationExpired(auth) : false;
              const inactive = auth && (auth.status ?? "").toUpperCase() !== "ACTIVE";
              return (
                <div key={plan.paymentLinkId ?? `${plan.name}-${plan.communityName}`} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[
                        plan.communityName,
                        plan.amount != null ? formatNaira(plan.amount) : null,
                        plan.dueDate
                          ? `Next due ${new Date(plan.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`
                          : null,
                      ].filter(Boolean).join(" · ")}
                    </p>
                    {!auth && (
                      <p className="text-[11px] text-gray-400 mt-1">Pay once and save your method to enable Auto-Pay</p>
                    )}
                    {expired && (
                      <p className="text-[11px] text-red-500 mt-1">
                        Your saved card ({auth.bank ?? "Card"} ●●●● {auth.last4}) expired
                        {auth.expMonth && auth.expYear ? ` ${auth.expMonth}/${auth.expYear}` : ""}.
                        Auto-Pay charges will fail — pay once with a new card to update it.
                      </p>
                    )}
                    {!expired && inactive && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Your saved payment method is no longer active, so automatic
                        charges may fail. Pay once with a new method to re-enable Auto-Pay.
                      </p>
                    )}
                  </div>
                  <Toggle on={!!auth} onChange={() => handleToggle(plan, auth)} disabled={!auth} showLabel />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-md" style={{ background: "#D7E2FF", border: "1px solid #002FA7" }}>
        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border border-[#002FA7] mt-0.5">
          <span className="text-[#002FA7] text-[9px] font-bold">i</span>
        </div>
        <p className="text-xs text-gray-700">
          Auto-Pay charges your saved payment method on each due date, and you'll
          get an in-app and email reminder 3 days before every charge. If a charge
          fails (an expired card, insufficient funds, or a declined transaction),
          the payment stays due and you'll be notified so you can pay manually.
        </p>
      </div>
    </div>
  );
}
