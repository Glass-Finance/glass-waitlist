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
  paid: { cls: "bg-[#ecfdf5] text-[#059669]", label: "Paid" },
  success: { cls: "bg-[#ecfdf5] text-[#059669]", label: "Paid" },
  successful: { cls: "bg-[#ecfdf5] text-[#059669]", label: "Paid" },
  unpaid: { cls: "bg-[#fff1f2] text-[#e11d48]", label: "Unpaid" },
  pending: { cls: "bg-[#fffbeb] text-[#b45309]", label: "Pending" },
  initiated: { cls: "bg-[#fffbeb] text-[#b45309]", label: "Pending" },
  failed: { cls: "bg-[#fff1f2] text-[#e11d48]", label: "Failed" },
};

export function statusStyle(status = "") {
  return STATUS_STYLE[status.toLowerCase()] ?? STATUS_STYLE.pending;
}

const FREQUENCY_STYLE = {
  MONTHLY: { cls: "bg-[#FFF8E7] text-[#b45309]", label: "Monthly" },
  WEEKLY: { cls: "bg-brand-tint text-brand", label: "Weekly" },
  QUARTERLY: { cls: "bg-[#ECFDF5] text-[#0f766e]", label: "Quarterly" },
  YEARLY: { cls: "bg-[#ECFDF5] text-[#059669]", label: "Annually" },
};

export function freqStyle(row) {
  if (row.type !== "recurring")
    return { cls: "bg-[#F3EEFF] text-[#7c3aed]", label: "One-Time" };
  return (
    FREQUENCY_STYLE[(row.frequency ?? "").toUpperCase()] ?? {
      cls: "bg-[#F3EEFF] text-[#7c3aed]",
      label: "Recurring",
    }
  );
}
