import { AlertTriangle, X } from "lucide-react";

// Generalized version of the bottom-sheet confirm pattern first built for
// MyCommunities.jsx's LeaveConfirmModal -- a real in-app disclaimer instead
// of the bare OS window.confirm() the member app's destructive actions
// (remove payment method, turn off auto-pay) previously relied on, which is
// easy to blow past without reading and breaks the app's visual flow.
export default function ConfirmSheet({
  icon: Icon = AlertTriangle,
  title,
  description,
  confirmLabel = "Yes, continue",
  confirmingLabel,
  danger = true,
  confirming = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(15,23,42,0.45)]"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-white rounded-t-[20px] pt-6 px-5 pb-7"
      >
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="bg-transparent border-none cursor-pointer p-1 text-[#9CA3AF]"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center text-center gap-2.5">
          <div
            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center mb-1 ${danger ? "bg-[#FEF2F2]" : "bg-brand-tint"}`}
          >
            <Icon size={24} className={danger ? "text-danger" : "text-brand"} />
          </div>
          <p className="text-[17px] font-bold text-[#111] m-0">{title}</p>
          <p className="text-[13.5px] text-[#6B7280] m-0 leading-[1.55] max-w-[320px]">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            onClick={onConfirm}
            disabled={confirming}
            className={`w-full py-3.5 px-0 rounded-xl border-none text-white text-[14.5px] font-semibold ${danger ? "bg-danger" : "bg-brand"} ${confirming ? "cursor-default opacity-70" : "cursor-pointer opacity-100"}`}
          >
            {confirming ? (confirmingLabel ?? "Please wait…") : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            className="w-full py-3.5 px-0 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-[14.5px] font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
