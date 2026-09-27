import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCommunityAccount } from "../../../hooks/useCommunityAccount";
import { daysInMonth, dateInputToIso } from "../../../utils/date";
import {
  inputCls,
  FREQUENCIES,
  RETRY_POLICIES,
  REMINDER_FREQUENCIES,
  REMINDER_CHANNELS,
  AMOUNT_MODES,
  AUDIENCE_OPTIONS,
  AUDIENCE_EMPTY_MESSAGE,
  VISIBILITY_OPTIONS,
} from "./constants";
import {
  toDateInput,
  blurOnWheel,
  intervalUnitLabel,
  validatePlanField,
  validateAmountForMode,
  amountRequiredForMode,
  amountPayloadForMode,
  amountModesForPlanType,
} from "./helpers";
import { PayoutAccountField, BillingDayField } from "./PlanFormFields";
import AudienceMemberPicker from "./AudienceMemberPicker";
import { useEscapeToClose } from "../../../hooks/useKeyboardShortcuts";

// ── Edit plan modal ───────────────────────────────────────────────────────────
export default function EditPlanModal({ plan, communityId, onClose, onSave, saving }) {
  useEscapeToClose(onClose);
  const initialEndAt = toDateInput(plan.endAt ?? plan.recurringPlan?.endAt);
  // Hydrated from the plan, not defaulted: the PATCH handler falls back to the
  // stored value for any field it omits, so re-sending the current audience /
  // visibility / amountMode is what makes them editable here at all. These
  // fields used to be absent from this payload entirely, which silently made
  // them unchangeable after creation.
  const [form, setForm] = useState({
    name: plan.name ?? "",
    amount: String(plan.amount ?? ""),
    amountMode: plan.amountMode ?? "FIXED",
    audience: plan.audience ?? "ALL_MEMBERS",
    visibility: plan.visibility ?? "PUBLIC",
    memberIds: plan.memberIds ?? [],
    frequency: plan.frequency ?? plan.recurringPlan?.frequency ?? "",
    startDate: toDateInput(plan.startAt ?? plan.recurringPlan?.startAt),
    billingDay: String(plan.recurringPlan?.billingDay ?? ""),
    interval: String(plan.recurringPlan?.interval ?? ""),
    endAt: initialEndAt,
    graceDays: String(plan.recurringPlan?.graceDays ?? ""),
    retryPolicy: plan.recurringPlan?.retryPolicy ?? "NO_RETRY",
    // DISABLED is the explicit "off" value the backend sends back — fall
    // back to the channels list only for older data that predates it.
    reminderEnabled:
      plan.reminderFrequency && plan.reminderFrequency !== "DISABLED"
        ? true
        : (plan.reminderChannels ?? []).length > 0,
    reminderFrequency:
      plan.reminderFrequency && plan.reminderFrequency !== "DISABLED"
        ? plan.reminderFrequency
        : "EVERY_3_DAYS",
    reminderChannels: plan.reminderChannels ?? [],
    communityAccountId: plan.communityAccountId ?? "",
  });
  const { accounts } = useCommunityAccount(communityId);
  const [fieldErrors, setFieldErrors] = useState({ name: "", amount: "", audience: "" });
  // Track the original endAt so we know whether the user has cleared a
  // previously-set value — that's the only case where clearEndAt needs to
  // be sent, since omitting endAt on a PATCH otherwise leaves it untouched.
  const [initialEndAtValue] = useState(initialEndAt);
  const isRecurring = plan.type === "RECURRING";
  const isDaily = form.frequency === "DAILY";

  const editBillingDayMax = (() => {
    if (form.frequency === "WEEKLY") return 7;
    if (!form.startDate) return 31;
    const [year, month] = form.startDate.split("-").map(Number);
    return daysInMonth(year, month);
  })();

  useEffect(() => {
    // Clamps billingDay when a startDate change shrinks the valid range
    // (e.g. picking February after typing "31") -- billingDay stays
    // otherwise freely user-editable, so this can't be a derived value.
    if (form.billingDay && Number(form.billingDay) > editBillingDayMax) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({ ...f, billingDay: String(editBillingDayMax) }));
    }
  }, [editBillingDayMax, form.billingDay]);

  function handleFieldBlur(field) {
    return (e) =>
      setFieldErrors((fe) => ({
        ...fe,
        [field]:
          field === "amount"
            ? validateAmountForMode(e.target.value, form.amountMode)
            : validatePlanField(field, e.target.value),
      }));
  }

  const amountRequired = amountRequiredForMode(form.amountMode);
  // Same asymmetry as create: the PATCH path DOES reject a SELECTED_MEMBERS
  // audience with an empty list, so the gate here is a convenience (an
  // explanatory message) rather than the only line of defence.
  const audienceReady = form.audience !== "SELECTED_MEMBERS" || form.memberIds.length > 0;

  async function handleSave() {
    const nameError = validatePlanField("name", form.name);
    const amountError = validateAmountForMode(form.amount, form.amountMode);
    const audienceError = audienceReady ? "" : AUDIENCE_EMPTY_MESSAGE;
    if (nameError || amountError || audienceError) {
      setFieldErrors({ name: nameError, amount: amountError, audience: audienceError });
      return;
    }
    const clearedEndAt = !!initialEndAtValue && !form.endAt;
    const payload = {
      title: form.name,
      amount: amountPayloadForMode(form.amountMode, form.amount),
      amountMode: form.amountMode,
      audience: form.audience,
      visibility: form.visibility,
      ...(form.audience === "SELECTED_MEMBERS" ? { memberIds: form.memberIds } : {}),
      ...(isRecurring && form.frequency
        ? {
            recurringPlan: {
              frequency: form.frequency,
              ...(form.interval ? { interval: Number(form.interval) } : {}),
              ...(!isDaily && form.billingDay ? { billingDay: Number(form.billingDay) } : {}),
              ...(form.endAt
                ? { endAt: dateInputToIso(form.endAt, { endOfDayIfToday: true, clampToNow: true }) }
                : {}),
              ...(clearedEndAt ? { clearEndAt: true } : {}),
              retryPolicy: form.retryPolicy || "NO_RETRY",
              graceDays: form.graceDays ? Number(form.graceDays) : 0,
            },
          }
        : {}),
      ...(form.startDate ? { startAt: dateInputToIso(form.startDate, { clampToNow: true }) } : {}),
      // Root-level, matching the confirmed PATCH schema — same shape as
      // create. DISABLED is sent explicitly when off (a real enum member,
      // confirmed via the backend's own validation error).
      ...(form.reminderEnabled && form.reminderChannels?.length
        ? {
            reminderFrequency: form.reminderFrequency || "EVERY_3_DAYS",
            reminderChannels: form.reminderChannels,
          }
        : { reminderFrequency: "DISABLED" }),
      ...(form.communityAccountId ? { communityAccountId: form.communityAccountId } : {}),
    };
    await onSave(plan.id, payload);
  }

  const isReady =
    form.name && !validateAmountForMode(form.amount, form.amountMode) && audienceReady;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-black/20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-bg rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-black">Edit Payment Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              You can edit or pause any plan at any time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Plan Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => ({ ...f, name: value }));
                setFieldErrors((fe) =>
                  fe.name ? { ...fe, name: validatePlanField("name", value) } : fe,
                );
              }}
              onBlur={handleFieldBlur("name")}
              placeholder="Plan name"
              style={fieldErrors.name ? { borderColor: "var(--color-danger)" } : undefined}
            />
            {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
          </div>

          <PayoutAccountField
            accounts={accounts}
            value={form.communityAccountId}
            onChange={(v) => setForm((f) => ({ ...f, communityAccountId: v }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount type</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none !pr-9`}
                  value={form.amountMode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => ({ ...f, amountMode: value }));
                    // The stored amount stays put across a mode switch on
                    // purpose: wiping what someone typed because they changed
                    // a dropdown is worse than carrying a figure that is still
                    // valid for the new mode (VARIABLE accepts one as a
                    // baseline; FIXED/MINIMUM/SUGGESTED require one anyway).
                    setFieldErrors((fe) => ({
                      ...fe,
                      amount: validateAmountForMode(form.amount, value),
                    }));
                  }}
                  data-testid="amount-mode"
                >
                  {AMOUNT_MODES.filter((o) =>
                    amountModesForPlanType(plan.type).includes(o.value),
                  ).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
              </div>
              {amountModesForPlanType(plan.type).length === 1 && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Recurring plans always bill a fixed amount.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Amount Per Member{" "}
                {amountRequired ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-gray-400">(optional)</span>
                )}
              </label>
              <input
                type="number"
                onWheel={blurOnWheel}
                className={inputCls}
                value={form.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({ ...f, amount: value }));
                  setFieldErrors((fe) =>
                    fe.amount
                      ? { ...fe, amount: validateAmountForMode(value, form.amountMode) }
                      : fe,
                  );
                }}
                onBlur={handleFieldBlur("amount")}
                placeholder="₦0"
                style={fieldErrors.amount ? { borderColor: "var(--color-danger)" } : undefined}
              />
              {fieldErrors.amount && (
                <p className="text-xs text-danger mt-1">{fieldErrors.amount}</p>
              )}
              {!amountRequired && !fieldErrors.amount && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Leave blank and members pay any amount they choose.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Who it's for</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none !pr-9`}
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                  data-testid="audience"
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Who can pay</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none !pr-9`}
                  value={form.visibility}
                  onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
                  data-testid="visibility"
                >
                  {VISIBILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
              </div>
            </div>
          </div>

          {form.audience === "SELECTED_MEMBERS" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Members <span className="text-red-500">*</span>
              </label>
              <AudienceMemberPicker
                communityId={communityId}
                selected={form.memberIds}
                onChange={(ids) => {
                  setForm((f) => ({ ...f, memberIds: ids }));
                  setFieldErrors((fe) => ({ ...fe, audience: "" }));
                }}
              />
              {/* Proactive for the same reason as the create wizard: Save is
                  disabled while the selection is empty, so a submit-only
                  message would never be seen. */}
              {(fieldErrors.audience ||
                (form.audience === "SELECTED_MEMBERS" && !form.memberIds.length)) && (
                <p className="text-xs text-danger mt-1">
                  {fieldErrors.audience || AUDIENCE_EMPTY_MESSAGE}
                </p>
              )}
            </div>
          )}

          {isRecurring && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequency</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none !pr-9`}
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                >
                  {FREQUENCIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
              </div>
            </div>
          )}

          {isRecurring && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Repeat Every</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  onWheel={blurOnWheel}
                  min={1}
                  className={inputCls + " max-w-[100px]"}
                  value={form.interval}
                  placeholder="1"
                  onChange={(e) => {
                    const raw = e.target.value;
                    setForm((f) => ({
                      ...f,
                      interval: raw === "" ? "" : String(Math.max(1, Number(raw))),
                    }));
                  }}
                />
                <span className="text-xs text-gray-500">
                  {intervalUnitLabel(form.frequency, form.interval || 1)}
                </span>
              </div>
            </div>
          )}

          <div
            className={`grid gap-3 ${isRecurring && !isDaily ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            {isRecurring && !isDaily && (
              <BillingDayField
                frequency={form.frequency}
                value={form.billingDay}
                max={editBillingDayMax}
                onChange={(v) => setForm((f) => ({ ...f, billingDay: v }))}
              />
            )}
          </div>

          {isRecurring && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                End Date <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.endAt}
                min={form.startDate || undefined}
                onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
              />
              {initialEndAtValue && !form.endAt && (
                <p className="text-[11px] text-amber-600 mt-1">
                  This will remove the existing end date.
                </p>
              )}
            </div>
          )}

          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Grace Period (days)
                </label>
                <input
                  type="number"
                  onWheel={blurOnWheel}
                  min={0}
                  className={inputCls}
                  value={form.graceDays}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value;
                    setForm((f) => ({
                      ...f,
                      graceDays: raw === "" ? "" : String(Math.max(0, Number(raw))),
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Retry Policy
                </label>
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none !pr-9`}
                    value={form.retryPolicy}
                    onChange={(e) => setForm((f) => ({ ...f, retryPolicy: e.target.value }))}
                  >
                    {RETRY_POLICIES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={form.reminderEnabled}
                onChange={(e) => setForm((f) => ({ ...f, reminderEnabled: e.target.checked }))}
              />
              Send automatic reminders to unpaid members
            </label>
            {form.reminderEnabled && (
              <div className="flex flex-col gap-2.5 pl-6">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Remind every</label>
                  <div className="relative">
                    <select
                      className={`${inputCls} appearance-none !pr-9`}
                      value={form.reminderFrequency || "EVERY_3_DAYS"}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reminderFrequency: e.target.value }))
                      }
                    >
                      {REMINDER_FREQUENCIES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5">Send via</label>
                  <div className="flex flex-col gap-1.5">
                    {REMINDER_CHANNELS.map((c) => {
                      const checked = form.reminderChannels.includes(c.value);
                      return (
                        <label
                          key={c.value}
                          className="flex items-center gap-2 text-xs text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                reminderChannels: checked
                                  ? f.reminderChannels.filter((v) => v !== c.value)
                                  : [...f.reminderChannels, c.value],
                              }))
                            }
                          />
                          {c.label}
                        </label>
                      );
                    })}
                  </div>
                  {form.reminderChannels.length === 0 && (
                    <p className="text-[11px] text-red-500 mt-1">
                      Choose at least one channel, or reminders will be saved disabled.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={!isReady || saving}
            className="px-6 py-2 rounded-lg text-xs font-normal text-white bg-brand hover:opacity-90 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
