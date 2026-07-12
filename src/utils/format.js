// Shared display-formatting helpers, consolidated out of ~15-20 near-identical
// per-file copies. Signatures below match the majority behavior found across
// those copies; options exist only where a real caller needed a genuine
// difference (e.g. 2-decimal receipts, null-as-dash).

// "₦12,000" by default. Pass { decimals: 2 } for receipt-style precision,
// { emptyDash: true } to render "—" for null/undefined instead of "₦0"
// (a few dashboard summary cards want that distinction).
export function formatNaira(amount, { decimals = 0, emptyDash = false } = {}) {
  if (emptyDash && (amount === null || amount === undefined)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(amount ?? 0)
    .replace("NGN", "₦");
}

// Abbreviated form for tight stat rows: "₦1.20M", "₦4.8K". Falls back to
// formatNaira below the K threshold.
export function formatNairaCompact(amount) {
  if (amount === null || amount === undefined) return "—";
  const n = Number(amount);
  if (isNaN(n)) return "—";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return formatNaira(n);
}

export function toTitleCase(str) {
  if (!str) return str;
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// "Jul 11, 2026" — the dominant date-display style across the app.
export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "11 July 2026" — used where a fuller, non-abbreviated date reads better.
export function formatDateLong(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// "Today 6:42" / "Yesterday 6:41" / "Jul 9, 6:30" — the relative timestamp
// style used by notification lists.
export function formatRelativeDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (d.toDateString() === now.toDateString()) return `Today ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}, ${time}`;
}
