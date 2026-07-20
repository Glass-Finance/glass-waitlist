import { formatNaira, toTitleCase } from "../../../utils/format";
import { PLAN_STATUS, FREQUENCIES } from "./constants";
import { formatCompact } from "./helpers";
import PlanOverflowMenu from "./PlanOverflowMenu";

export default function PlanCard({
  plan,
  planPlans,
  barColorCls,
  onEdit,
  onViewMembers,
  onSendReminder,
  onDuplicate,
  metrics,
}) {
  const ps = PLAN_STATUS[plan.status] ?? PLAN_STATUS.DRAFT;

  const freqLabel =
    plan.type === "RECURRING"
      ? (FREQUENCIES.find((f) => f.value === plan.frequency)?.label ??
        plan.frequency ??
        "Recurring")
      : "One-Time";

  // Prefer computed metrics (from obligations/transactions) over the list
  // endpoint's metrics which are never populated server-side.
  const cm = metrics ?? {};
  const paidCount = cm.paidCount ?? plan.paidCount ?? 0;
  const totalCount = cm.totalCount ?? plan.totalCount ?? 0;
  const collected = cm.collected ?? plan.amountCollected ?? 0;
  const expected =
    totalCount > 0 && plan.amount > 0
      ? plan.amount * totalCount
      : (plan.expectedAmount ?? 0);
  const pct =
    expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  return (
    <div
      className="bg-surface-container rounded-2xl border border-surface-container-border p-5 flex flex-col gap-4 shadow-[0_1px_6px_rgba(0,47,167,0.07)]"
    >
      {/* Status + overflow */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${ps.cls}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ps.dotCls}`}
          />
          {ps.label}
        </span>
        <PlanOverflowMenu
          plan={plan}
          planPlans={planPlans}
          onEdit={onEdit}
          onViewMembers={onViewMembers}
          onSendReminder={onSendReminder}
          onDuplicate={onDuplicate}
        />
      </div>

      {/* Name */}
      <p className="text-[15px] font-semibold text-black leading-snug">
        {toTitleCase(plan.name)}
      </p>

      {/* Amount + frequency + collected */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-md font-semibold text-gray-900 leading-none">
            {formatNaira(plan.amount)}
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 text-[#7c3aed] bg-[#f3eeff]"
          >
            {freqLabel}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          <span className="font-semibold text-gray-600">
            {formatCompact(collected)}
          </span>
          /{formatCompact(expected)} Collected
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${barColorCls}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            {paidCount} / {totalCount} members paid
          </p>
          <p className="text-xs text-gray-400">
            Due{" "}
            {plan.dueAt
              ? new Date(plan.dueAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
