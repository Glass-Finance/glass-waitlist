import { Info } from "lucide-react";
import { Skeleton } from "../SkeletonUI";

export default function DashboardStats({ stats, isLoading }) {
  return (
    // auto-fit/minmax instead of fixed breakpoints (was grid-cols-2
    // sm:grid-cols-3 lg:grid-cols-5) -- that jumped straight from 3 to 5
    // columns at the lg breakpoint, and 5-across didn't leave enough width
    // for the longer labels ("Inactive Members", "Overdue Members") to fit
    // on one line right around 1024px, while the shorter labels stayed
    // single-line and threw the row out of alignment. This sizes each card
    // to whatever the row actually has room for instead of a hardcoded
    // column count.
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          // Same single-row shape as the shared StatCard.jsx (label+value
          // stacked as one text block, icon beside it) instead of two full
          // rows stacked (label+info, then icon+value) -- the two-row
          // version was inherently taller regardless of padding, most
          // visible on mobile where each card is full-width with no
          // grid-stretch from a taller sibling to mask the difference.
          className="flex items-center justify-between gap-3 bg-surface-container rounded-lg p-4 border border-surface-container-border"
        >
          <div>
            <p className="flex items-center gap-1 text-sm text-gray-500 font-medium mb-1">
              {s.label}
              <Info size={13} className="text-brand" />
            </p>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-2xl font-bold text-black">{s.value}</p>
            )}
          </div>
          <img
            src={s.icon}
            alt={s.label}
            className="w-9 h-9 object-contain flex-shrink-0"
          />
        </div>
      ))}
    </div>
  );
}
