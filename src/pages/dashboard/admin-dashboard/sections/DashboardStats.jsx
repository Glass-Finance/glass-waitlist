import { Info } from "lucide-react";
import { Skeleton } from "../SkeletonUI";

export default function DashboardStats({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-surface-container rounded-xl px-4 py-3 border border-surface-container-border shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">
              {s.label}
            </span>
            <Info size={13} className="text-brand" />
          </div>
          <div className="flex items-center gap-2.5">
            <img
              src={s.icon}
              alt={s.label}
              className="w-7 h-7 object-contain flex-shrink-0"
            />
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="text-[13px] font-semibold text-black">
                {s.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
