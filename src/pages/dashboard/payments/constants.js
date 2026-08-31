// Shared constants for the payment-plan modals/wizard (Payments.jsx and its
// extracted pieces under this folder). Split out so each file only imports
// what it actually needs instead of every consumer redeclaring these.

export const PLAN_STATUS = {
  ACTIVE: { cls: "bg-[#ecfdf5] text-[#059669]", dotCls: "bg-[#059669]", label: "Active" },
  PAUSED: { cls: "bg-[#fffbeb] text-[#b45309]", dotCls: "bg-[#b45309]", label: "Paused" },
  DRAFT: { cls: "bg-[#f5f6fa] text-[#6b7280]", dotCls: "bg-[#6b7280]", label: "Draft" },
  EXPIRED: { cls: "bg-[#fff1f2] text-[#e11d48]", dotCls: "bg-[#e11d48]", label: "Inactive" },
  ARCHIVED: { cls: "bg-[#fff1f2] text-[#e11d48]", dotCls: "bg-[#e11d48]", label: "Inactive" },
};

// NOTE: value must match the backend's RecurringPlanRequest.frequency enum
// exactly (DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUALLY | CUSTOM).
// Previously this used "YEARLY", which is not a valid enum value on the
// backend — any yearly plan created before this fix would have failed
// validation or been silently rejected server-side.
export const FREQUENCIES = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Annually", value: "ANNUALLY" },
];

// Matches RecurringPlanRequest.retryPolicy enum.
export const RETRY_POLICIES = [
  { label: "No retry", value: "NO_RETRY" },
  { label: "Retry every 24 hours", value: "EVERY_24H" },
  { label: "Retry with backoff (7 days)", value: "EXPONENTIAL_BACKOFF_7D" },
];

// Singular unit label per frequency, used to build the "repeat every N ___"
// copy next to the interval input.
export const FREQUENCY_UNIT_LABEL = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  QUARTERLY: "quarter",
  ANNUALLY: "year",
};

// Weekday names for WEEKLY billing — backend expects 1=Monday … 7=Sunday.
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Confirmed against the backend's actual enum (com.glassfinance.backend.
// model.enums.ReminderFrequency) via a 500 error that listed every accepted
// value — there is no daily option; EVERY_3_DAYS is the most frequent one
// available. DISABLED is a real member too (the "off" state is an explicit
// value, not just an omitted field) — handled separately in the payload
// builders below, not offered as a selectable option here.
export const REMINDER_FREQUENCIES = [
  { label: "Every 3 Days", value: "EVERY_3_DAYS" },
  { label: "Every Week", value: "WEEKLY" },
  { label: "Every 2 Weeks", value: "BIWEEKLY" },
  { label: "Every Month", value: "MONTHLY" },
];
// Matches the notification API's channel enum (IN_APP | EMAIL | WHATSAPP).
export const REMINDER_CHANNELS = [
  { label: "In-app notification", value: "IN_APP" },
  { label: "Email", value: "EMAIL" },
  { label: "WhatsApp", value: "WHATSAPP" },
];
export const TABS = ["All Plans", "Recurring", "One Time"];
export const BAR_COLOR_CLASSES = ["bg-[#d4a017]", "bg-[#7c3aed]", "bg-brand", "bg-[#059669]"];

export const inputCls =
  "w-full h-12 min-h-8 px-4 py-1 rounded-lg border-[1.5px] border-gray-200 text-placeholder text-black placeholder-black/60 outline-none transition-all focus:border-[#002FA7]";

// Description field is taller (128px, per Figma) with real top padding
// instead of reusing the single-line field's vertically-centered py-1 --
// a textarea needs the text to start at the top, not float mid-box.
// Padding and radius are deliberately asymmetric to match the Figma spec
// exactly (top 24 / right 24 / bottom 4 / left 16, radius 16).
export const textareaCls =
  "w-full h-32 pt-6 pr-6 pb-1 pl-4 rounded-2xl border-[1.5px] border-gray-200 text-placeholder text-gray-700 outline-none transition-all resize-none focus:border-[#002FA7]";
