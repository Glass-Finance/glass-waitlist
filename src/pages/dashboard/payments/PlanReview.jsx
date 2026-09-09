import { formatNaira, formatDate } from "../../../utils/format";
import {
  FREQUENCIES,
  REMINDER_FREQUENCIES,
  REMINDER_CHANNELS,
  RETRY_POLICIES,
} from "./constants";
import { billingDayLabel, intervalUnitLabel, payoutAccountLabel } from "./helpers";

export default function PlanReview({ planType, form, slug, accounts }) {
  const rows = [
    { label: "Plan Name", value: form.name || "—" },
    { label: "URL slug", value: slug || "—" },
    {
      label: "Plan Type",
      value: planType === "recurring" ? "Recurring" : "One Time",
    },
    {
      label: "Amount",
      value: form.amount ? formatNaira(Number(form.amount)) : "—",
    },
    ...(accounts && accounts.length > 1
      ? [{ label: "Payout Account", value: payoutAccountLabel(accounts.find((account) => account.id === form.communityAccountId)) }]
      : []),
    ...(planType === "recurring"
      ? [
          {
            label: "Frequency",
            value: (FREQUENCIES.find((frequency) => frequency.value === form.frequency)?.label ?? form.frequency) || "—",
          },
          {
            label: "Repeats Every",
            value: `${form.interval || 1} ${intervalUnitLabel(form.frequency, form.interval || 1)}`,
          },
          ...(form.frequency !== "DAILY"
            ? [{ label: "Billing Day", value: billingDayLabel(form.frequency, form.billingDay) }]
            : []),
          { label: "End Date", value: form.endAt ? formatDate(form.endAt) : "No end date" },
          { label: "Grace Period", value: `${form.graceDays || 0} day(s)` },
          {
            label: "Retry Policy",
            value: RETRY_POLICIES.find((retry) => retry.value === (form.retryPolicy || "NO_RETRY"))?.label ?? "No retry",
          },
        ]
      : [
          {
            label: "Due Date",
            value: form.dueDate
              ? new Date(form.dueDate).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—",
          },
        ]),
    {
      label: "Activate",
      value: (form.activateImmediately ?? true) ? "Immediately" : "Manually later",
    },
    {
      label: "Reminders",
      value:
        (form.reminderEnabled ?? true) && (form.reminderChannels ?? []).length
          ? `${REMINDER_FREQUENCIES.find((frequency) => frequency.value === form.reminderFrequency)?.label ?? "Every 3 Days"} via ${(form.reminderChannels ?? []).map((channel) => REMINDER_CHANNELS.find((option) => option.value === channel)?.label ?? channel).join(", ")}`
          : "Off",
    },
  ];

  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden mb-3">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex justify-between px-4 py-2.5 text-xs ${index < rows.length - 1 ? "border-b border-gray-100" : ""} ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
          >
            <span className="text-gray-500 w-36">{row.label}</span>
            <span className="font-semibold text-gray-900">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-gray-500">
        Once created, assigned members will receive a notification.
      </div>
    </div>
  );
}
