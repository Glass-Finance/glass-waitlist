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
          // Figma: min-height 152px (not a fixed height -- a wrapped label
          // like "Overdue Members" shouldn't clip or force the card taller
          // than its siblings), 24px padding, 8px radius, space-between so
          // the icon+value row stays pinned to the bottom of the card
          // instead of drifting up under a short single-line label.
          className="min-h-[152px] flex flex-col justify-between bg-surface-container rounded-lg p-6 border border-surface-container-border"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {s.label}
            </span>
            <Info size={15} className="text-brand" />
          </div>
          <div className="flex items-center gap-3">
            <img
              src={s.icon}
              alt={s.label}
              className="w-9 h-9 object-contain flex-shrink-0"
            />
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="text-2xl font-bold text-black">
                {s.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
