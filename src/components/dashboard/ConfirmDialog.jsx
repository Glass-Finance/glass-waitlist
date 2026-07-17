import { Loader2 } from "lucide-react";
import ModalShell from "./ModalShell";

// Generic branded confirm dialog for dashboard destructive/state-changing
// actions (remove member, promote/demote, remove payment method, turn off
// auto-pay, etc.) -- replaces the raw window.confirm() these previously
// used, which reads as a system warning rather than part of the product
// and is easy to blow past without reading.
export default function ConfirmDialog({
  title,
  subtitle,
  description,
  confirmLabel = "Confirm",
  confirmingLabel,
  danger = true,
  confirming = false,
  onConfirm,
  onClose,
}) {
  return (
    <ModalShell title={title} subtitle={subtitle} onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-4">
        {description && (
          <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        )}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: danger ? "var(--color-danger)" : "var(--color-brand)" }}
          >
            {confirming && <Loader2 size={12} className="animate-spin" />}
            {confirming ? (confirmingLabel ?? "Please wait…") : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
