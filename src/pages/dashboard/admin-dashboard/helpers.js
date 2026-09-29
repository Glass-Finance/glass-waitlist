import { formatNaira as sharedFormatNaira } from "../../../utils/format";

// This page shows "—" for a null/undefined amount rather than "₦0" (several
// stat cards read as genuinely unknown before data loads, not zero).
export function formatNaira(amount) {
  return sharedFormatNaira(amount, { emptyDash: true });
}

export function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_STYLE = {
  paid: { cls: "bg-success-wash text-success-strong", label: "Paid" },
  success: { cls: "bg-success-wash text-success-strong", label: "Paid" },
  successful: { cls: "bg-success-wash text-success-strong", label: "Paid" },
  unpaid: { cls: "bg-danger-wash-2 text-danger-bright", label: "Unpaid" },
  pending: { cls: "bg-warning-wash text-warning", label: "Pending" },
  initiated: { cls: "bg-warning-wash text-warning", label: "Pending" },
  failed: { cls: "bg-danger-wash-2 text-danger-bright", label: "Failed" },
};

export function statusStyle(status = "") {
  return STATUS_STYLE[status.toLowerCase()] ?? STATUS_STYLE.pending;
}

const FREQUENCY_STYLE = {
  MONTHLY: { cls: "bg-warning-wash text-warning", label: "Monthly" },
  WEEKLY: { cls: "bg-brand-tint text-brand", label: "Weekly" },
  QUARTERLY: { cls: "bg-success-wash text-[#0f766e]", label: "Quarterly" },
  YEARLY: { cls: "bg-success-wash text-success-strong", label: "Annually" },
};

export function freqStyle(row) {
  if (row.type !== "recurring")
    return { cls: "bg-accent-purple-wash text-accent-purple", label: "One-Time" };
  return (
    FREQUENCY_STYLE[(row.frequency ?? "").toUpperCase()] ?? {
      cls: "bg-accent-purple-wash text-accent-purple",
      label: "Recurring",
    }
  );
}
