import { useEffect, useState } from "react";
import { X, Check, ArrowLeft } from "lucide-react";
import { useSlug } from "../../../hooks/useSlug";
import { useCommunityAccount } from "../../../hooks/useCommunityAccount";
import { dateInputToIso } from "../../../utils/date";
import { validatePlanField } from "./helpers";
import PlanStepIndicator from "./PlanStepIndicator";
import { Step1, Step2, Step3 } from "./PlanFormSteps";

// ── Create plan modal ─────────────────────────────────────────────────────────
export default function CreatePlanModal({ communityId, onClose, onCreate, creating, createError }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const [step, setStep] = useState(1);
  const [planType, setPlanType] = useState("recurring");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    frequency: "",
    startDate: "",
    dueDate: "",
    billingDay: "",
    interval: "",
    endAt: "",
    graceDays: "",
    retryPolicy: "NO_RETRY",
    activateImmediately: true,
    reminderEnabled: true,
    reminderFrequency: "EVERY_3_DAYS",
    reminderChannels: ["IN_APP"],
    communityAccountId: "",
  });
  const slugState = useSlug("PAYMENT_LINK");
  const [fieldErrors, setFieldErrors] = useState({ name: "", amount: "" });
  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: validatePlanField(k, v) } : fe));
  };
  const handleFieldBlur = (field) => (e) =>
    setFieldErrors((fe) => ({ ...fe, [field]: validatePlanField(field, e.target.value) }));

  // Only relevant when a community has more than one payout account
  // connected (PayoutAccountField hides itself otherwise) — default to
  // whichever is flagged as the default so the field always has an
  // explicit value the moment there's a real choice to make.
  const { accounts } = useCommunityAccount(communityId);
  useEffect(() => {
    if (form.communityAccountId || accounts.length === 0) return;
    const def = accounts.find((a) => a.defaultAccount) ?? accounts[0];
    if (def) setForm((f) => ({ ...f, communityAccountId: def.id }));
  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps
  const canContinue =
    step === 1
      ? !!planType
      : step === 2
        ? !!(
            form.name &&
            Number(form.amount) > 0 &&
            slugState.slug &&
            (planType === "recurring" ? form.frequency : form.dueDate)
          )
        : true;

  function handleStep2Continue() {
    const nameError = validatePlanField("name", form.name);
    const amountError = validatePlanField("amount", form.amount);
    if (nameError || amountError) {
      setFieldErrors({ name: nameError, amount: amountError });
      return;
    }
    setStep(3);
  }

  async function handleSubmit() {
    const startIso = form.startDate
      ? dateInputToIso(form.startDate, { clampToNow: true })
      : new Date().toISOString();
    const payload = {
      title: form.name,
      amount: Number(form.amount),
      paymentType: planType === "recurring" ? "RECURRING" : "ONE_TIME",
      slug: slugState.slug,
      activateImmediately: form.activateImmediately ?? true,
      audience: "ALL_MEMBERS",
      visibility: "PUBLIC",
      amountMode: "FIXED",
      ...(form.description?.trim()
        ? { description: form.description.trim() }
        : {}),
      ...(form.communityAccountId
        ? { communityAccountId: form.communityAccountId }
        : {}),
      ...(planType === "recurring"
        ? {
            recurringPlan: {
              frequency: form.frequency,
              interval: form.interval ? Number(form.interval) : 1,
              startAt: startIso,
              // billingDay doesn't apply to DAILY — the cycle is driven by
              // startAt + interval instead, so omit it in that case rather
              // than sending a meaningless day-of-month/week value.
              ...(form.frequency !== "DAILY" && form.billingDay
                ? { billingDay: Number(form.billingDay) }
                : {}),
              ...(form.endAt
                ? { endAt: dateInputToIso(form.endAt, { endOfDayIfToday: true, clampToNow: true }) }
                : {}),
              retryPolicy: form.retryPolicy || "NO_RETRY",
              graceDays: form.graceDays ? Number(form.graceDays) : 0,
            },
          }
        : {
            ...(form.startDate ? { startAt: startIso } : {}),
            // A due date of "today" needs to mean "through the end of
            // today" — clamping it to the exact instant Submit is clicked
            // instead raced the backend's own clock and made today
            // unselectable for a one-time payment's due date in practice.
            dueAt: dateInputToIso(form.dueDate, { endOfDayIfToday: true, clampToNow: true }),
          }),
      // Root-level, not nested under recurringPlan — applies to one-time
      // plans too. DISABLED is a real enum member (confirmed via the
      // backend's own validation error), so "off" is sent explicitly
      // rather than omitting the field.
      ...(form.reminderEnabled && form.reminderChannels?.length
        ? {
            reminderFrequency: form.reminderFrequency || "EVERY_3_DAYS",
            reminderChannels: form.reminderChannels,
          }
        : { reminderFrequency: "DISABLED" }),
    };
    if (import.meta.env.DEV) console.log("[CreatePlan] payload →", payload);
    const ok = await onCreate(payload);
    if (ok) setSuccess(true);
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <h2 className="text-base font-semibold text-black">
              Create Payment Plan
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              You can edit or pause any plan at any time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent border-solid"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
          {success ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-green-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Plan Created!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Members have been notified.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded bg-brand text-white font-medium text-xs cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <PlanStepIndicator current={step} />
              <div className="flex-1 overflow-y-auto">
                {step === 1 && (
                  <Step1 value={planType} onChange={setPlanType} />
                )}
                {step === 2 && (
                  <Step2
                    planType={planType}
                    form={form}
                    onChange={update}
                    slugState={slugState}
                    accounts={accounts}
                    fieldErrors={fieldErrors}
                    onFieldBlur={handleFieldBlur}
                  />
                )}
                {step === 3 && (
                  <Step3
                    planType={planType}
                    form={form}
                    slug={slugState.slug}
                    accounts={accounts}
                  />
                )}
              </div>
              {createError && (
                <p className="text-xs text-red-500 mt-2">{createError}</p>
              )}
            </>
          )}
        </div>
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft size={12} /> {step > 1 ? "Back" : "Cancel"}
            </button>
            <button
              onClick={() => {
                if (step === 2) { handleStep2Continue(); return; }
                step < 3 ? setStep((s) => s + 1) : handleSubmit();
              }}
              disabled={
                !canContinue ||
                creating ||
                slugState.checking ||
                slugState.available === false
              }
              className={`px-6 py-2 rounded text-xs font-medium border-none cursor-pointer ${canContinue ? "bg-brand text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              {creating ? "Creating…" : step === 3 ? "Create Plan" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

