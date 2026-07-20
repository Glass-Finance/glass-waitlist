import { Wallet } from "lucide-react";
import EmptyState from "../../../../components/common/EmptyState";
import { toTitleCase } from "../../../../utils/format";
import { Skeleton } from "../SkeletonUI";
import { formatNaira } from "../helpers";

const BAR_COLOR_CLASSES = [
  "bg-[#d4a017]",
  "bg-[#7c3aed]",
  "bg-[#099DA8]",
  "bg-[#059669]",
  "bg-brand",
  "bg-[#e11d48]",
];

export default function PaymentPlansCard({
  plans,
  plansLoading,
  planMetrics,
  membersTotal,
  onManageAll,
}) {
  return (
    <div className="rounded-xl border border-surface-container-border p-4 bg-[#D7E2FF] shadow-[0_1px_4px_rgba(0,47,167,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-black">Payment Plans</span>
        <button
          onClick={onManageAll}
          className="text-xs font-medium text-brand bg-transparent border-none cursor-pointer hover:underline"
        >
          Manage All
        </button>
      </div>

      {plansLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={Wallet} title="No payment plans yet" className="py-6" />
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((p, idx) => {
            const cm = planMetrics[p.id] ?? {};
            const paidCount = cm.paidCount ?? p.paidCount ?? 0;
            const totalCount =
              cm.totalCount > 0
                ? cm.totalCount
                : p.totalCount > 0
                  ? p.totalCount
                  : membersTotal;
            const collected = cm.collected ?? p.amountCollected ?? 0;
            const expected =
              p.amount > 0 && totalCount > 0
                ? p.amount * totalCount
                : (p.expectedAmount ?? 0);
            const pct =
              expected > 0
                ? Math.min(100, Math.round((collected / expected) * 100))
                : 0;
            const barColorCls = BAR_COLOR_CLASSES[idx % BAR_COLOR_CLASSES.length];
            return (
              <div
                key={p.id}
                className="bg-surface-container rounded-xl p-4 border border-blue-100/60"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-black truncate">
                      {toTitleCase(p.name)}
                    </span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full flex-shrink-0 text-[#7c3aed] bg-[#f3eeff]">
                      {p.frequency ?? p.type ?? "—"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 flex-shrink-0 ml-2">
                    {formatNaira(p.amount)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">
                  {paidCount} / {totalCount} members paid
                </p>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColorCls}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-right mt-1">
                  {pct}% Collected
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
