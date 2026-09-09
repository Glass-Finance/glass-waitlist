import { formatNaira as sharedFormatNaira } from "../../utils/format";

export function formatNaira(amount) {
  return sharedFormatNaira(amount, { decimals: 2 });
}

export function splitNaira(amount) {
  const full = formatNaira(amount);
  const dot = full.lastIndexOf(".");
  if (dot === -1) return { whole: full, decimals: "" };
  return { whole: full.slice(0, dot), decimals: full.slice(dot) };
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHeaderDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day},${year} • ${hours}:${minutes}${ampm}`;
}

export function statusLabel(status) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "success" || normalized === "successful")
    return "Successful";
  if (normalized === "failed") return "Failed";
  return "Pending";
}

export function maskEmail(email) {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (local.length <= 4) return `${local[0]}**@${domain}`;
  return `${local.slice(0, 2)}**${local.slice(-2)}@${domain}`;
}

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
