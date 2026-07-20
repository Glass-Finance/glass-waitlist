import { useEffect } from "react";
import { RefreshCw, Zap, Check, Loader2, X } from "lucide-react";
import { daysInMonth } from "../../../utils/date";
import { formatNaira, formatDate } from "../../../utils/format";
import {
  inputCls,
  FREQUENCIES,
  RETRY_POLICIES,
  REMINDER_FREQUENCIES,
  REMINDER_CHANNELS,
} from "./constants";
import { blurOnWheel, intervalUnitLabel, billingDayLabel, payoutAccountLabel } from "./helpers";
import { PayoutAccountField, BillingDayField } from "./PlanFormFields";

export function Step1({ value, onChange }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-5">
        Choose the type of plan you want to create
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            id: "recurring",
            icon: <RefreshCw size={22} />,
            title: "Recurring",
            desc: "Members pay on a set schedule.",
          },
          {
            id: "one_time",
            icon: <Zap size={22} />,
            title: "One Time",
            desc: "A single payment for one purpose.",
          },
        ].map((opt) => {
          const sel = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`p-6 min-h-[180px] rounded-xl text-left border-2 transition-all relative flex flex-col ${sel ? "border-brand bg-blue-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div
                className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? "bg-brand border-brand" : "border-gray-300"}`}
              >
                {sel && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              <div className="mt-6 mb-3 text-gray-600">{opt.icon}</div>
              <p className="text-sm font-medium text-gray-900">{opt.title}</p>
              <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Step2({ planType, form, onChange, slugState, accounts, fieldErrors = {}, onFieldBlur }) {
  const { slug, setSlug, available, checking, suggesting, suggestFrom } =
    slugState;

  const isDaily = form.frequency === "DAILY";

  // Weekly billing days are 1–7 (day of week). Monthly billing days are
  // validated against the selected start date's actual month (e.g. 28 for
  // February) rather than a flat 1–28/1–31 range — falls back to 31 (the
  // most permissive value) until a start date is chosen. Daily plans don't
  // use billingDay at all — the cycle is driven by startAt + interval — so
  // this value is unused (and the field hidden) when frequency is DAILY.
  const billingDayMax = (() => {
    if (form.frequency === "WEEKLY") return 7;
    if (!form.startDate) return 31;
    const [year, month] = form.startDate.split("-").map(Number);
    return daysInMonth(year, month);
  })();

  // If the user picked a billing day for a longer month, then switches to
  // a shorter one (e.g. 31 → February), the stale value is now invalid —
  // clamp it down rather than silently submitting an out-of-range day.
  useEffect(() => {
    if (form.billingDay && Number(form.billingDay) > billingDayMax) {
      onChange("billingDay", String(billingDayMax));
    }
  }, [billingDayMax]);

  return (
    <div className="pr-1 space-y-3.5">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Plan Name
        </label>
        <input
          className={inputCls}
          value={form.name || ""}
          placeholder="Enter plan name"
          onChange={(e) => onChange("name", e.target.value)}
          onBlur={(e) => { if (!slug) suggestFrom(form.name); onFieldBlur?.("name")(e); }}
          style={fieldErrors.name ? { borderColor: "var(--color-danger)" } : undefined}
        />
        {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          URL slug
        </label>
        <div className="relative">
          <input
            className={inputCls + " pr-8"}
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="e.g. alumni-dues-2026"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {(checking || suggesting) && (
              <Loader2 size={14} className="animate-spin text-gray-400" />
            )}
            {!checking && !suggesting && available === true && (
              <Check size={14} className="text-green-600" />
            )}
            {!checking && !suggesting && available === false && (
              <X size={14} className="text-red-500" />
            )}
          </span>
        </div>
        {available === false && !checking && (
          <p className="text-xs text-red-500 mt-1">
            That URL is taken — try another.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className={`${inputCls} resize-y`}
          value={form.description || ""}
          rows={3}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
      <PayoutAccountField
        accounts={accounts}
        value={form.communityAccountId}
        onChange={(v) => onChange("communityAccountId", v)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            onWheel={blurOnWheel}
            className={inputCls}
            value={form.amount || ""}
            placeholder="₦0.00"
            onChange={(e) => onChange("amount", e.target.value)}
            onBlur={onFieldBlur?.("amount")}
            style={fieldErrors.amount ? { borderColor: "var(--color-danger)" } : undefined}
          />
          {fieldErrors.amount && <p className="text-xs text-danger mt-1">{fieldErrors.amount}</p>}
        </div>
        {planType === "recurring" && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              className={inputCls}
              value={form.frequency || ""}
              onChange={(e) => onChange("frequency", e.target.value)}
            >
              <option value="" disabled>
                Select frequency
              </option>
              {FREQUENCIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Interval — multiplier on top of frequency, e.g. frequency=DAILY +
          interval=3 means "every 3 days". Required by RecurringPlanRequest;
          defaults to 1 (i.e. every single cycle) when left blank. */}
      {planType === "recurring" && form.frequency && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Repeat Every
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              onWheel={blurOnWheel}
              min={1}
              className={inputCls + " max-w-[100px]"}
              value={form.interval || ""}
              placeholder="1"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onChange("interval", "");
                  return;
                }
                onChange("interval", String(Math.max(1, Number(raw))));
              }}
            />
            <span className="text-xs text-gray-500">
              {intervalUnitLabel(form.frequency, form.interval || 1)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            className={inputCls}
            value={form.startDate || ""}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </div>
        {planType === "recurring" ? (
          !isDaily && (
            <BillingDayField
              frequency={form.frequency}
              value={form.billingDay}
              max={billingDayMax}
              onChange={(v) => onChange("billingDay", v)}
            />
          )
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.dueDate || ""}
              min={form.startDate || undefined}
              onChange={(e) => onChange("dueDate", e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Optional end date for recurring plans — when to stop generating
          new obligations. Left blank = runs indefinitely. */}
      {planType === "recurring" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            End Date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            className={inputCls}
            value={form.endAt || ""}
            min={form.startDate || undefined}
            onChange={(e) => onChange("endAt", e.target.value)}
          />
        </div>
      )}

      {planType === "recurring" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Grace Period (days)
            </label>
            <input
              type="number"
              onWheel={blurOnWheel}
              min={0}
              className={inputCls}
              value={form.graceDays || ""}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value;
                onChange(
                  "graceDays",
                  raw === "" ? "" : String(Math.max(0, Number(raw))),
                );
              }}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Days after due date before a payment is marked overdue.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Retry Policy
            </label>
            <select
              className={inputCls}
              value={form.retryPolicy || "NO_RETRY"}
              onChange={(e) => onChange("retryPolicy", e.target.value)}
            >
              {RETRY_POLICIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Default reminder cadence for this plan — sent automatically to
          unpaid members going forward. Separate from "Send Reminder" in the
          plan's ⋯ menu, which fires an immediate one-off blast on top of
          whatever's configured here. */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
          <input
            type="checkbox"
            checked={form.reminderEnabled ?? true}
            onChange={(e) => onChange("reminderEnabled", e.target.checked)}
          />
          Send automatic reminders to unpaid members
        </label>
        {(form.reminderEnabled ?? true) && (
          <div className="flex flex-col gap-2.5 pl-6">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">
                Remind every
              </label>
              <select
                className={inputCls}
                value={form.reminderFrequency || "EVERY_3_DAYS"}
                onChange={(e) => onChange("reminderFrequency", e.target.value)}
              >
                {REMINDER_FREQUENCIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5">
                Send via
              </label>
              <div className="flex flex-col gap-1.5">
                {REMINDER_CHANNELS.map((c) => {
                  const checked = (form.reminderChannels ?? []).includes(c.value);
                  return (
                    <label key={c.value} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const current = form.reminderChannels ?? [];
                          onChange(
                            "reminderChannels",
                            checked
                              ? current.filter((v) => v !== c.value)
                              : [...current, c.value],
                          );
                        }}
                      />
                      {c.label}
                    </label>
                  );
                })}
              </div>
              {(form.reminderChannels ?? []).length === 0 && (
                <p className="text-[11px] text-red-500 mt-1">
                  Choose at least one channel, or reminders will be created disabled.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={form.activateImmediately ?? true}
          onChange={(e) => onChange("activateImmediately", e.target.checked)}
        />
        Activate immediately after creation
      </label>
    </div>
  );
}

export function Step3({ planType, form, slug, accounts }) {
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
      ? [
          {
            label: "Payout Account",
            value: payoutAccountLabel(
              accounts.find((a) => a.id === form.communityAccountId),
            ),
          },
        ]
      : []),
    ...(planType === "recurring"
      ? [
          {
            label: "Frequency",
            value:
              (FREQUENCIES.find((f) => f.value === form.frequency)?.label ??
                form.frequency) ||
              "—",
          },
          {
            label: "Repeats Every",
            value: `${form.interval || 1} ${intervalUnitLabel(form.frequency, form.interval || 1)}`,
          },
          ...(form.frequency !== "DAILY"
            ? [
                {
                  label: "Billing Day",
                  value: billingDayLabel(form.frequency, form.billingDay),
                },
              ]
            : []),
          {
            label: "End Date",
            value: form.endAt ? formatDate(form.endAt) : "No end date",
          },
          {
            label: "Grace Period",
            value: `${form.graceDays || 0} day(s)`,
          },
          {
            label: "Retry Policy",
            value:
              RETRY_POLICIES.find(
                (r) => r.value === (form.retryPolicy || "NO_RETRY"),
              )?.label ?? "No retry",
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
      value:
        (form.activateImmediately ?? true) ? "Immediately" : "Manually later",
    },
    {
      label: "Reminders",
      value:
        (form.reminderEnabled ?? true) && (form.reminderChannels ?? []).length
          ? `${REMINDER_FREQUENCIES.find((f) => f.value === form.reminderFrequency)?.label ?? "Every 3 Days"} via ${(form.reminderChannels ?? []).map((c) => REMINDER_CHANNELS.find((r) => r.value === c)?.label ?? c).join(", ")}`
          : "Off",
    },
  ];
  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden mb-3">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`flex justify-between px-4 py-2.5 text-xs ${i < rows.length - 1 ? "border-b border-gray-100" : ""} ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
          >
            <span className="text-gray-500 w-36">{r.label}</span>
            <span className="font-semibold text-gray-900">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-gray-500">
        Once created, assigned members will receive a notification.
      </div>
    </div>
  );
}
