import { ChevronDown, Clock } from "lucide-react";
import EmptyState from "../../../../components/common/EmptyState";
import { toTitleCase } from "../../../../utils/format";
import { formatNaira, statusStyle, freqStyle } from "../helpers";

export default function YourPaymentsSection({
  rows,
  sortDir,
  onToggleSort,
  filter,
  filterOpen,
  onToggleFilterOpen,
  onFilterSelect,
  onPayNow,
}) {
  return (
    <div className="bg-surface-container rounded-xl border border-surface-container-border p-5 mb-5 shadow-[0_1px_4px_rgba(0,47,167,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-black">Your Payments</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSort}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Sort
            <ChevronDown size={11} className={sortDir === "asc" ? "rotate-180" : ""} />
          </button>
          <div className="relative">
            <button
              onClick={onToggleFilterOpen}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Filter <ChevronDown size={11} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-surface-container-border shadow-lg z-20 min-w-[110px] overflow-hidden">
                {[
                  { key: null, label: "All" },
                  { key: "unpaid", label: "Unpaid" },
                  { key: "paid", label: "Paid" },
                ].map((opt) => (
                  <button
                    key={String(opt.key)}
                    onClick={() => onFilterSelect(opt.key)}
                    className={`w-full px-3 py-2 text-left text-xs cursor-pointer border-none ${
                      filter === opt.key
                        ? "bg-blue-50 font-medium text-brand"
                        : "bg-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Clock} title="Nothing due right now" className="py-4" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F3F4F6]">
                {["Plan", "Frequency", "Amount", "Due Date", "Status", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      className="p-2 text-left text-xs font-normal text-gray-400"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isPaid = row.status === "PAID" || row.status === "SUCCESSFUL";
                const s = statusStyle(isPaid ? "paid" : "unpaid");
                const f = freqStyle(row);
                return (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="py-3 px-2 text-xs font-medium text-gray-800">
                      {toTitleCase(row.name)}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.cls}`}
                      >
                        {f.label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-black">
                      {formatNaira(row.amount)}
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-500">
                      {row.dueDate
                        ? new Date(row.dueDate).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {isPaid ? (
                        <button
                          disabled
                          className="px-4 py-1.5 rounded text-xs font-semibold text-gray-300 border border-gray-200 bg-white cursor-not-allowed"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <button
                          onClick={() => onPayNow(row)}
                          className="px-4 py-1.5 rounded text-xs font-semibold text-brand border border-brand bg-white hover:bg-blue-50 cursor-pointer transition-all"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
