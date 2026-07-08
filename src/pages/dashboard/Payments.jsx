import { useMemo, useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"; // useMutation may need adding if not already imported
import {
  Plus,
  MoreHorizontal,
  X,
  RefreshCw,
  Zap,
  Check,
  ArrowLeft,
  Loader2,
  Wallet,
  ListChecks,
  Clock,
  XCircle,
  Pencil,
  Users,
  Search,
  Filter,
  ChevronDown,
  Bell,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { useSlug } from "../../hooks/useSlug";
import { dateInputToIso, daysInMonth } from "../../utils/date";
import { getErrorMessage, notifyError } from "../../utils/errorHandler";
import { getPaymentLinkMembers } from "../../api/payments";
import Background from "../../assets/background.webp";
import { getCommunityMembers } from "../../api/communities";
import {
  getCommunityObligations,
  getCommunityTransactions,
} from "../../api/transactions";
import { waiveObligation } from "../../api/communities";
import { useCommunityMembers } from "../../hooks/useCommunityMembers";

const PLAN_STATUS = {
  ACTIVE: { bg: "#ecfdf5", color: "#059669", label: "Active" },
  PAUSED: { bg: "#fffbeb", color: "#b45309", label: "Paused" },
  DRAFT: { bg: "#f5f6fa", color: "#6b7280", label: "Draft" },
  EXPIRED: { bg: "#fff1f2", color: "#e11d48", label: "Inactive" },
  ARCHIVED: { bg: "#fff1f2", color: "#e11d48", label: "Inactive" },
};
const FREQUENCIES = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Annually", value: "YEARLY" },
];
const REMINDERS = ["Every Day", "Every 3 Days", "Every Week", "Every 2 Weeks"];
const TABS = ["All Plans", "Recurring", "One Time"];
const BAR_COLORS = ["#d4a017", "#7c3aed", "#002FA7", "#059669"];

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white outline-none transition-all focus:border-[#002FA7]";

function toTitleCase(str) {
  if (!str) return str;
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  })
    .format(amount ?? 0)
    .replace("NGN", "₦");
}
function formatCompact(amount) {
  return new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount ?? 0);
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div
      className="bg-[#EFEFF1E5] rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
      style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
    >
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-[13px] font-semibold text-black">{value}</p>
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon size={14} style={{ color }} />
      </div>
    </div>
  );
}

// ── Create plan — step indicator ───────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: "Plan Type" },
    { n: 2, label: "Plan Details" },
    { n: 3, label: "Review" },
  ];
  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i) => {
        const done = s.n < current,
          active = s.n === current;
        return (
          <div
            key={s.n}
            className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-medium text-xs border
                ${done ? "bg-[#002FA7] border-[#002FA7] text-white" : active ? "border-[#002FA7] text-[#002FA7] bg-white" : "border-gray-300 text-gray-400 bg-white"}`}
              >
                {done ? <Check size={13} /> : s.n}
              </div>
              <span
                className={`text-[11px] whitespace-nowrap ${active ? "font-semibold text-[#002FA7]" : done ? "text-gray-600" : "text-gray-400"}`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-[#002FA7]" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ value, onChange }) {
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
              className={`p-6 min-h-[180px] rounded-xl text-left border-2 transition-all relative flex flex-col ${sel ? "border-[#002FA7] bg-blue-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div
                className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? "bg-[#002FA7] border-[#002FA7]" : "border-gray-300"}`}
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

function Step2({ planType, form, onChange, slugState }) {
  const { slug, setSlug, available, checking, suggesting, suggestFrom } =
    slugState;

  // Weekly billing days are 1–7 (day of week). Monthly billing days are
  // validated against the selected start date's actual month (e.g. 28 for
  // February) rather than a flat 1–28/1–31 range — falls back to 31 (the
  // most permissive value) until a start date is chosen.
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
          onBlur={() => !slug && suggestFrom(form.name)}
        />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            className={inputCls}
            value={form.amount || ""}
            placeholder="₦0.00"
            onChange={(e) => onChange("amount", e.target.value)}
          />
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Billing Day{" "}
              {form.frequency === "WEEKLY"
                ? "(1=Mon, 7=Sun)"
                : "(day of month)"}
            </label>
            <input
              type="number"
              className={inputCls}
              value={form.billingDay || ""}
              min={1}
              max={billingDayMax}
              placeholder={
                form.frequency === "WEEKLY" ? "1–7" : `1–${billingDayMax}`
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onChange("billingDay", "");
                  return;
                }
                const clamped = Math.min(
                  Math.max(Number(raw), 1),
                  billingDayMax,
                );
                onChange("billingDay", String(clamped));
              }}
            />
            {form.frequency &&
              form.frequency !== "WEEKLY" &&
              form.startDate && (
                <p className="text-[11px] text-gray-400 mt-1">
                  {billingDayMax < 31
                    ? `The selected start month only has ${billingDayMax} days.`
                    : null}
                </p>
              )}
          </div>
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
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Auto Reminder
        </label>
        <select
          className={inputCls}
          value={form.reminder || ""}
          onChange={(e) => onChange("reminder", e.target.value)}
        >
          <option value="" disabled>
            Select reminder frequency
          </option>
          {REMINDERS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Sent via SMS and email to unpaid members.
        </p>
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

function Step3({ planType, form, slug }) {
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
    ...(planType === "recurring"
      ? [
          {
            label: "Frequency",
            value:
              (FREQUENCIES.find((f) => f.value === form.frequency)?.label ??
                form.frequency) ||
              "—",
          },
          { label: "Billing Day", value: form.billingDay || "—" },
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

// ── Create plan modal ─────────────────────────────────────────────────────────
function CreatePlanModal({ onClose, onCreate, creating, createError }) {
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
    reminder: "",
    activateImmediately: true,
  });
  const slugState = useSlug("PAYMENT_LINK");
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canContinue =
    step === 1
      ? !!planType
      : step === 2
        ? !!(
            form.name &&
            form.amount &&
            slugState.slug &&
            (planType === "recurring" ? form.frequency : form.dueDate)
          )
        : true;

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
      ...(planType === "recurring"
        ? {
            recurringPlan: {
              frequency: form.frequency,
              startAt: startIso,
              billingDay: form.billingDay
                ? Number(form.billingDay)
                : new Date(startIso).getDate(),
            },
          }
        : {
            ...(form.startDate ? { startAt: startIso } : {}),
            dueAt: dateInputToIso(form.dueDate, { clampToNow: true }),
          }),
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
      <div className="bg-[#EFEFF1E5] rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
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
                className="px-6 py-2 rounded bg-[#002FA7] text-white font-medium text-xs cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <StepIndicator current={step} />
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
                  />
                )}
                {step === 3 && (
                  <Step3
                    planType={planType}
                    form={form}
                    slug={slugState.slug}
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
              onClick={() =>
                step < 3 ? setStep((s) => s + 1) : handleSubmit()
              }
              disabled={
                !canContinue ||
                creating ||
                slugState.checking ||
                slugState.available === false
              }
              className={`px-6 py-2 rounded text-xs font-medium border-none cursor-pointer ${canContinue ? "bg-[#002FA7] text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              {creating ? "Creating…" : step === 3 ? "Create Plan" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit plan modal ───────────────────────────────────────────────────────────
function EditPlanModal({ plan, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: plan.name ?? "",
    amount: String(plan.amount ?? ""),
    frequency: plan.frequency ?? plan.recurringPlan?.frequency ?? "",
    startDate: toDateInput(plan.startAt ?? plan.recurringPlan?.startAt),
    billingDay: String(plan.recurringPlan?.billingDay ?? ""),
  });
  const isRecurring = plan.type === "RECURRING";

  const editBillingDayMax = (() => {
    if (form.frequency === "WEEKLY") return 7;
    if (!form.startDate) return 31;
    const [year, month] = form.startDate.split("-").map(Number);
    return daysInMonth(year, month);
  })();

  useEffect(() => {
    if (form.billingDay && Number(form.billingDay) > editBillingDayMax) {
      setForm((f) => ({ ...f, billingDay: String(editBillingDayMax) }));
    }
  }, [editBillingDayMax]);

  async function handleSave() {
    const payload = {
      title: form.name,
      amount: Number(form.amount),
      ...(isRecurring && form.frequency
        ? {
            recurringPlan: {
              frequency: form.frequency,
              ...(form.billingDay
                ? { billingDay: Number(form.billingDay) }
                : {}),
            },
          }
        : {}),
      ...(form.startDate
        ? { startAt: dateInputToIso(form.startDate, { clampToNow: true }) }
        : {}),
    };
    await onSave(plan.id, payload);
  }

  const isReady = form.name && form.amount;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#EFEFF1E5] rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-black">
              Edit Payment Plan
            </h2>
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
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Plan Name
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Plan name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Amount Per Member
              </label>
              <input
                type="number"
                className={inputCls}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="₦0"
              />
            </div>
            {isRecurring && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Frequency
                </label>
                <select
                  className={inputCls}
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, frequency: e.target.value }))
                  }
                >
                  {FREQUENCIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            className={`grid gap-3 ${isRecurring ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            {isRecurring && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Billing Day{" "}
                  {form.frequency === "WEEKLY"
                    ? "(1=Mon, 7=Sun)"
                    : "(day of month)"}
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.billingDay}
                  min={1}
                  max={editBillingDayMax}
                  placeholder={
                    form.frequency === "WEEKLY"
                      ? "1–7"
                      : `1–${editBillingDayMax}`
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setForm((f) => ({ ...f, billingDay: "" }));
                      return;
                    }
                    const clamped = Math.min(
                      Math.max(Number(raw), 1),
                      editBillingDayMax,
                    );
                    setForm((f) => ({ ...f, billingDay: String(clamped) }));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={!isReady || saving}
            className="px-6 py-2 rounded text-xs font-normal text-white bg-[#002FA7] hover:opacity-90 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan members modal ────────────────────────────────────────────────────────
function PlanMembersModal({ plan, communityId, onClose }) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);

  // Plan-specific obligation statuses
  const { data: planMembersData, isLoading } = useQuery({
    queryKey: ["plan-members", communityId, plan.id],
    queryFn: async () => {
      const res = await getPaymentLinkMembers(communityId, plan.id, {
        pageSize: 500,
      });
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : (raw?.content ?? []);
    },
    enabled: !!(communityId && plan.id),
    staleTime: 1000 * 60,
  });

  // Community members — for reliable name + email resolution. Explicitly
  // overrides getCommunityMembers' default ACTIVE-only filter: this modal
  // needs to show paid/unpaid status for every member ever on this plan,
  // including ones who've since gone overdue/inactive — filtering them out
  // here was why they silently disappeared from the paid/unpaid list.
  const { data: communityMembersData } = useQuery({
    queryKey: ["community", communityId, "members", "all-statuses"],
    queryFn: async () => {
      const res = await getCommunityMembers(communityId, { status: undefined });
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
  });

  // Obligations — authoritative source for paid/due status per member
  // Uses the same cache key as the main Payments page so no extra request.
  const { data: allObligations = [] } = useQuery({
    queryKey: ["community", communityId, "obligations"],
    queryFn: async () => {
      const res = await getCommunityObligations(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
  });

  // Build memberId / userId → { name, email, joinedAt } lookup. Also track
  // every ID this community currently knows about (any status) so only
  // genuinely-removed members get filtered out below — overdue/inactive
  // members must still show up in the paid/unpaid breakdown.
  // getCommunityMembers returns a flat shape: cm.userId (not cm.user.id).
  const { memberLookup, knownMemberIds } = useMemo(() => {
    const byMemberId = {};
    const byUserId = {};
    const knownIds = new Set();
    for (const m of communityMembersData ?? []) {
      const first = m.user?.firstName ?? m.firstName ?? "";
      const last = m.user?.lastName ?? m.lastName ?? "";
      const name = `${first} ${last}`.trim() || null;
      const email = m.user?.email ?? m.email ?? null;
      const info = {
        name,
        email,
        joinedAt: m.joinedAt ?? m.member?.joinedAt ?? null,
      };
      // cm.id = community membership ID; cm.userId = user's global ID (flat field)
      const userId = m.userId ?? m.user?.id ?? null;
      if (m.id) {
        byMemberId[String(m.id)] = info;
        knownIds.add(String(m.id));
      }
      if (userId) {
        byUserId[String(userId)] = info;
        knownIds.add(String(userId));
      }
    }
    return { memberLookup: { byMemberId, byUserId }, knownMemberIds: knownIds };
  }, [communityMembersData]);

  // Show every member still known to the community — including
  // overdue/inactive ones — and only filter out members who've actually
  // been removed (and so no longer appear in communityMembersData at all).
  const planMembers = useMemo(() => {
    const all = planMembersData ?? [];
    if (!communityMembersData) return all; // don't filter while community list is loading
    return all.filter((m) => {
      const mid = String(m.member?.id ?? m.memberId ?? "");
      const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
      return knownMemberIds.has(mid) || knownMemberIds.has(uid);
    });
  }, [planMembersData, communityMembersData, knownMemberIds]);

  // Build a lookup for obligation status keyed by every reachable ID for this plan.
  // Obligations use ob.member.userId (flat) not ob.member.user.id (nested).
  // Plan members carry communityMemberId, so we bridge via communityMembersData:
  //   communityMemberId → userId → obligation info
  const obligationByMemberId = useMemo(() => {
    // Step 1: communityMemberId → userId (cm.userId is flat, not cm.user.id)
    const cmToUser = {};
    for (const cm of communityMembersData ?? []) {
      const userId = cm.userId ?? cm.user?.id ?? "";
      if (cm.id && userId) cmToUser[String(cm.id)] = String(userId);
    }

    // Step 2: index obligations by userId and email
    // const map = {};
    // for (const ob of allObligations) {
    //   if (String(ob.paymentLink?.id) !== String(plan.id)) continue;
    //   const info = {
    //     status: (ob.status ?? "PENDING").toUpperCase(),
    //     amountPaid: ob.amountPaid ?? ob.paidAmount ?? 0,
    //     amountDue: ob.amount ?? ob.amountDue ?? plan.amount ?? 0,
    //   };
    const map = {};
    for (const ob of allObligations) {
      if (String(ob.paymentLink?.id) !== String(plan.id)) continue;
      const info = {
        id: ob.id,
        status: (ob.status ?? "PENDING").toUpperCase(),
        amountPaid: ob.amountPaid ?? ob.paidAmount ?? 0,
        amountDue: ob.amount ?? ob.amountDue ?? plan.amount ?? 0,
      };
      // ob.member.userId is a flat field (not ob.member.user.id)
      const userId = String(
        ob.member?.userId ?? ob.member?.user?.id ?? ob.user?.id ?? "",
      );
      const email = ob.member?.email ?? ob.user?.email ?? "";
      if (userId) map[userId] = info;
      if (email) map[email] = info;
    }

    // Step 3: add communityMemberId entries so plan members can match directly
    for (const [cmId, userId] of Object.entries(cmToUser)) {
      if (map[userId]) map[cmId] = map[userId];
    }

    return map;
  }, [allObligations, communityMembersData, plan.id, plan.amount]);

  function getObligationInfo(m) {
    const mid = String(m.member?.id ?? m.memberId ?? "");
    const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
    // Use the plan member's own email (flat field) as well as the lookup email
    const email =
      m.email ??
      memberLookup.byMemberId[mid]?.email ??
      memberLookup.byUserId[uid]?.email ??
      "";
    return (
      (mid && obligationByMemberId[mid]) ||
      (uid && obligationByMemberId[uid]) ||
      (email && obligationByMemberId[email]) ||
      null
    );
  }

  function resolveMember(m) {
    const mid = String(m.member?.id ?? m.memberId ?? "");
    const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
    const fromLookup =
      (mid && memberLookup.byMemberId[mid]) ||
      (uid && memberLookup.byUserId[uid]);
    if (fromLookup) return fromLookup;
    // Flat plan-member response: firstName/lastName/email at the top level
    const u = m.member?.user ?? m.user ?? m.member ?? {};
    const f = u.firstName ?? m.firstName ?? "";
    const l = u.lastName ?? m.lastName ?? "";
    return {
      name: `${f} ${l}`.trim() || null,
      email: u.email ?? m.email ?? null,
      joinedAt: m.member?.joinedAt ?? m.joinedAt ?? null,
    };
  }

  function getName(m) {
    const r = resolveMember(m);
    return toTitleCase(r.name ?? r.email ?? "Member");
  }
  function getEmail(m) {
    return resolveMember(m).email ?? "—";
  }
  function getJoinedAt(m) {
    return (
      resolveMember(m).joinedAt ?? m.member?.joinedAt ?? m.joinedAt ?? null
    );
  }

  function getStatus(m) {
    const ob = getObligationInfo(m);
    if (ob) return ob.status;
    const raw =
      m.obligationStatus ??
      m.obligation?.status ??
      m.member?.obligationStatus ??
      m.paymentStatus ??
      m.status ??
      "PENDING";
    return raw.toUpperCase();
  }
  function getAmountPaid(m) {
    const ob = getObligationInfo(m);
    if (ob) return ob.amountPaid;
    return m.amountPaid ?? m.paidAmount ?? m.obligation?.amountPaid ?? 0;
  }
  function getAmountDue(m) {
    const ob = getObligationInfo(m);
    if (ob) return ob.amountDue;
    return m.amount ?? m.amountDue ?? m.obligation?.amount ?? plan.amount ?? 0;
  }

  // ── Member actions: waive + remove ───────────────────────────────────────
  const queryClient = useQueryClient();
  const { removeMember } = useCommunityMembers(communityId);

  const waive = useMutation({
    mutationFn: (obligationId) => waiveObligation(communityId, obligationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["community", communityId, "obligations"],
      });
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
    },
  });

  function handleWaive(m) {
    const ob = getObligationInfo(m);
    if (!ob?.id) return; // no real obligation to waive (e.g. unmatched link)
    if (
      window.confirm(
        `Waive this payment for ${getName(m)}? This forgives what they owe.`,
      )
    ) {
      waive.mutate(ob.id);
    }
  }

  function handleRemove(m) {
    const mid = m.member?.id ?? m.memberId;
    if (!mid) return;
    if (window.confirm(`Remove ${getName(m)} from this community?`)) {
      removeMember.mutate(mid);
    }
  }

  function statusStyle(s) {
    if (s === "PAID") return { bg: "#ecfdf5", color: "#059669", label: "Paid" };
    if (s === "OVERDUE")
      return { bg: "#fff1f2", color: "#e11d48", label: "Overdue" };
    if (s === "DUE") return { bg: "#fffbeb", color: "#b45309", label: "Due" };
    if (s === "WAIVED")
      return { bg: "#f5f6fa", color: "#6b7280", label: "Waived" };
    if (s === "NONE") return { bg: "#f5f6fa", color: "#9ca3af", label: "N/A" };
    return { bg: "#fffbeb", color: "#b45309", label: "Pending" };
  }

  const filtered = planMembers.filter((m) => {
    const q = search.toLowerCase();
    if (
      q &&
      !getName(m).toLowerCase().includes(q) &&
      !getEmail(m).toLowerCase().includes(q)
    )
      return false;
    if (statusFilter === "Paid" && getStatus(m) !== "PAID") return false;
    if (statusFilter === "Unpaid" && getStatus(m) === "PAID") return false;
    if (statusFilter === "Overdue" && getStatus(m) !== "OVERDUE") return false;
    return true;
  });

  const paidCount = planMembers.filter((m) => getStatus(m) === "PAID").length;
  const totalCount = planMembers.length;
  const totalCollected = planMembers.reduce(
    (sum, m) => sum + getAmountPaid(m),
    0,
  );

  function exportCsv() {
    const rows = selected.length
      ? filtered.filter((m) => selected.includes(m.id ?? getName(m)))
      : filtered;
    const header = "Name,Email,Status,Amount Paid,Amount Due,Date Joined\n";
    const body = rows
      .map((m) => {
        const s = statusStyle(getStatus(m));
        return `${getName(m)},${getEmail(m)},${s.label},${getAmountPaid(m)},${getAmountDue(m)},${formatDate(getJoinedAt(m))}`;
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${plan.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#EFEFF1E5] rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-black">
              {toTitleCase(plan.name)} — Members
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading
                ? "Loading…"
                : `${paidCount} / ${totalCount} paid · ${formatNaira(totalCollected)} collected`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#002FA7] text-xs font-semibold text-[#002FA7] hover:bg-blue-50 bg-white cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex-1 max-w-xs">
            <Search size={12} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
            >
              <Filter size={12} /> Filter
              {statusFilter && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#002FA7] flex-shrink-0" />
              )}
            </button>
            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-lg z-20 p-4 w-52">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white mb-3"
                  >
                    <option value="">All</option>
                    <option>Paid</option>
                    <option>Unpaid</option>
                    <option>Overdue</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setFilterOpen(false);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 cursor-pointer bg-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#002FA7] text-white text-xs font-semibold border-none cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0">
              <tr className="border-y border-gray-100 bg-gray-50">
                <th className="px-5 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === filtered.length && filtered.length > 0
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? filtered.map((m) => m.id ?? getName(m))
                          : [],
                      )
                    }
                  />
                </th>
                {[
                  "Member",
                  "Email",
                  "Status",
                  "Paid",
                  "Total Due",
                  "Date Joined",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-xs text-gray-400"
                  >
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-xs text-gray-400"
                  >
                    {planMembers.length === 0
                      ? "No members enrolled in this plan."
                      : "No members match your filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const key = m.id ?? i;
                  const s = statusStyle(getStatus(m));
                  return (
                    <tr
                      key={key}
                      className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(key)}
                          onChange={() =>
                            setSelected((p) =>
                              p.includes(key)
                                ? p.filter((x) => x !== key)
                                : [...p, key],
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#002FA7] whitespace-nowrap">
                        {getName(m)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {getEmail(m)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ color: s.color, background: s.bg }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800">
                        {formatNaira(getAmountPaid(m))}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatNaira(getAmountDue(m))}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(getJoinedAt(m))}
                      </td>
                      <td className="px-4 py-3">
                        <MemberRowMenu
                          member={m}
                          status={getStatus(m)}
                          onWaive={() => handleWaive(m)}
                          onRemove={() => handleRemove(m)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!isLoading && planMembers.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {planMembers.length} members
            </span>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter("")}
                className="text-xs font-semibold text-[#002FA7] bg-transparent border-none cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dropdown menu item ────────────────────────────────────────────────────────
function MenuItem({ icon, label, onClick, disabled, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium bg-transparent border-none cursor-pointer transition-colors text-left
        ${disabled ? "text-gray-300 cursor-not-allowed" : danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </button>
  );
}

function MemberRowMenu({ member, status, onWaive, onRemove }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const canWaive =
    status !== "PAID" && status !== "NONE" && status !== "WAIVED";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
      >
        <MoreHorizontal size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden min-w-[160px] py-1">
            <MenuItem
              label="Waive Payment"
              disabled={!canWaive}
              onClick={() => {
                onWaive();
                close();
              }}
            />
            <div className="h-px bg-gray-100 my-1" />
            <MenuItem
              label="Remove from Community"
              danger
              onClick={() => {
                onRemove();
                close();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Plan card "..." overflow menu ─────────────────────────────────────────────
function PlanOverflowMenu({ plan, planPlans, onEdit, onViewMembers }) {
  const [open, setOpen] = useState(false);
  const status = plan.status;
  const isActive = status === "ACTIVE";
  const isPaused = status === "PAUSED";
  const isDraft = status === "DRAFT";
  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden min-w-[180px] py-1">
            <MenuItem
              icon={<Pencil size={13} />}
              label="Edit Plan"
              onClick={() => {
                onEdit(plan);
                close();
              }}
            />
            <MenuItem
              icon={<Bell size={13} />}
              label="Send Reminder"
              disabled
            />
            <MenuItem
              icon={<Users size={13} />}
              label="View Members"
              onClick={() => {
                onViewMembers(plan);
                close();
              }}
            />
            {(isActive || isPaused) && (
              <>
                <div className="h-px bg-gray-100 my-1" />
                {isActive && (
                  <MenuItem
                    icon={<Pause size={13} />}
                    label="Pause Plan"
                    onClick={() => {
                      planPlans.pause.mutate(plan.id);
                      close();
                    }}
                  />
                )}
                {isPaused && (
                  <MenuItem
                    icon={<Play size={13} />}
                    label="Resume Plan"
                    onClick={() => {
                      planPlans.resume.mutate(plan.id);
                      close();
                    }}
                  />
                )}
                <MenuItem
                  icon={<Trash2 size={13} />}
                  label="End Plan"
                  danger
                  onClick={() => {
                    if (
                      window.confirm(
                        `End "${plan.name}"? This will mark it as expired.`,
                      )
                    ) {
                      planPlans.expire.mutate(plan.id);
                      close();
                    }
                  }}
                />
              </>
            )}
            {isDraft && (
              <>
                <div className="h-px bg-gray-100 my-1" />
                <MenuItem
                  label="Activate"
                  onClick={() => {
                    planPlans.activate.mutate(plan.id);
                    close();
                  }}
                />
              </>
            )}
            {status !== "ARCHIVED" && (
              <>
                <div className="h-px bg-gray-100 my-1" />
                <MenuItem
                  label="Archive"
                  onClick={() => {
                    planPlans.archive.mutate(plan.id);
                    close();
                  }}
                />
                <MenuItem
                  label="Duplicate"
                  onClick={() => {
                    planPlans.duplicate.mutate(plan.id);
                    close();
                  }}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  planPlans,
  barColor,
  onEdit,
  onViewMembers,
  metrics,
}) {
  const ps = PLAN_STATUS[plan.status] ?? PLAN_STATUS.DRAFT;

  const freqLabel =
    plan.type === "RECURRING"
      ? (FREQUENCIES.find((f) => f.value === plan.frequency)?.label ??
        plan.frequency ??
        "Recurring")
      : "One-Time";

  // Prefer computed metrics (from obligations/transactions) over the list
  // endpoint's metrics which are never populated server-side.
  const cm = metrics ?? {};
  const paidCount = cm.paidCount ?? plan.paidCount ?? 0;
  const totalCount = cm.totalCount ?? plan.totalCount ?? 0;
  const collected = cm.collected ?? plan.amountCollected ?? 0;
  const expected =
    totalCount > 0 && plan.amount > 0
      ? plan.amount * totalCount
      : (plan.expectedAmount ?? 0);
  const pct =
    expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  return (
    <div
      className="bg-[#EFEFF1E5] rounded-2xl border border-gray-100 p-5 flex flex-col gap-4"
      style={{ boxShadow: "0 1px 6px rgba(0,47,167,0.07)" }}
    >
      {/* Status + overflow */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{ color: ps.color, background: ps.bg }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: ps.color }}
          />
          {ps.label}
        </span>
        <PlanOverflowMenu
          plan={plan}
          planPlans={planPlans}
          onEdit={onEdit}
          onViewMembers={onViewMembers}
        />
      </div>

      {/* Name */}
      <p className="text-[15px] font-semibold text-black leading-snug">
        {toTitleCase(plan.name)}
      </p>

      {/* Amount + frequency + collected */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-md font-semibold text-gray-900 leading-none">
            {formatNaira(plan.amount)}
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ color: "#7c3aed", background: "#f3eeff" }}
          >
            {freqLabel}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          <span className="font-semibold text-gray-600">
            {formatCompact(collected)}
          </span>
          /{formatCompact(expected)} Collected
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            {paidCount} / {totalCount} members paid
          </p>
          <p className="text-xs text-gray-400">
            Due{" "}
            {plan.dueAt
              ? new Date(plan.dueAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Payments() {
  usePageTitle("Payments");
  const communityId = useActiveCommunityId();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingMembersPlan, setViewingMembersPlan] = useState(null);
  const [tab, setTab] = useState("All Plans");

  const planPlans = usePaymentPlans(communityId);
  const { plans, isLoading: plansLoading } = planPlans;

  // Obligations — who is enrolled in each plan and whether they've paid
  const { data: obligations = [] } = useQuery({
    queryKey: ["community", communityId, "obligations"],
    queryFn: async () => {
      const res = await getCommunityObligations(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  // Transactions — actual amounts collected per plan
  const { data: transactions = [] } = useQuery({
    queryKey: ["community", communityId, "transactions"],
    queryFn: async () => {
      const res = await getCommunityTransactions(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  // Compute per-plan: paidCount, totalCount (unique members), collected
  // const planMetrics = useMemo(() => {
  //   const SUCCESS = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);

  //   // The backend doesn't always update obligation.status to PAID
  //   // immediately after a payment is verified (same gap documented in
  //   // useMembersWithPayments.js) — without cross-referencing successful
  //   // transactions here too, paidCount can lag behind collected, showing
  //   // e.g. "100% collected" but "0/1 members paid" for the same plan.
  //   const paidObligationIds = new Set();
  //   const paidLinkMemberKeys = new Set(); // `${paymentLinkId}::${memberId}`, for txs with no obligationId
  //   for (const tx of transactions) {
  //     if (!SUCCESS.has((tx.status ?? "").toUpperCase())) continue;
  //     if (tx.obligationId) paidObligationIds.add(String(tx.obligationId));
  //     const planId = tx.paymentLink?.id;
  //     const mid = String(tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "");
  //     if (planId && mid) paidLinkMemberKeys.add(`${planId}::${mid}`);
  //   }

  //   const byPlan = {};

  //   for (const ob of obligations) {
  //     const planId = ob.paymentLink?.id;
  //     if (!planId) continue;
  //     if (!byPlan[planId]) byPlan[planId] = { collected: 0, paidCount: 0, memberIds: new Set() };
  //     const mid = String(ob.member?.id ?? ob.member?.user?.id ?? ob.user?.id ?? ob.id ?? "");
  //     if (mid) byPlan[planId].memberIds.add(mid);
  //     const s = (ob.status ?? "").toUpperCase();
  //     const isPaid =
  //       s === "PAID" ||
  //       s === "SUCCESSFUL" ||
  //       paidObligationIds.has(String(ob.id)) ||
  //       (planId && mid && paidLinkMemberKeys.has(`${planId}::${mid}`));
  //     if (isPaid) byPlan[planId].paidCount++;
  //   }

  //   for (const tx of transactions) {
  //     const planId = tx.paymentLink?.id;
  //     if (!planId) continue;
  //     if (!byPlan[planId]) byPlan[planId] = { collected: 0, paidCount: 0, memberIds: new Set() };
  //     if (SUCCESS.has((tx.status ?? "").toUpperCase())) {
  //       byPlan[planId].collected += tx.amount ?? 0;
  //     }
  //   }

  //   const result = {};
  //   for (const [id, m] of Object.entries(byPlan)) {
  //     result[id] = { collected: m.collected, paidCount: m.paidCount, totalCount: m.memberIds.size };
  //   }
  //   return result;
  // }, [obligations, transactions]);

  const planMetrics = useMemo(() => {
    const SUCCESS = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);

    // The backend doesn't always update obligation.status to PAID
    // immediately after a payment is verified — cross-reference successful
    // transactions too, so paidCount doesn't lag behind collected.
    const paidObligationIds = new Set();
    const paidLinkMemberKeys = new Set(); // `${paymentLinkId}::${memberId}`, for txs with no obligationId
    for (const tx of transactions) {
      if (!SUCCESS.has((tx.status ?? "").toUpperCase())) continue;
      if (tx.obligationId) paidObligationIds.add(String(tx.obligationId));
      const planId = tx.paymentLink?.id;
      const mid = String(
        tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "",
      );
      if (planId && mid) paidLinkMemberKeys.add(`${planId}::${mid}`);
    }

    const byPlan = {};

    // Track paid members as a unique-member set (paidMemberIds), not a
    // running counter — a member with 2 paid obligations on the same
    // recurring plan (e.g. 2 past cycles) is still only 1 paid member.
    // This is what was causing "2/1 members paid": paidCount was
    // incrementing per obligation while totalCount stayed unique-member.
    for (const ob of obligations) {
      const planId = ob.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId])
        byPlan[planId] = {
          collected: 0,
          memberIds: new Set(),
          paidMemberIds: new Set(),
        };
      const mid = String(
        ob.member?.id ?? ob.member?.user?.id ?? ob.user?.id ?? ob.id ?? "",
      );
      if (mid) byPlan[planId].memberIds.add(mid);
      const s = (ob.status ?? "").toUpperCase();
      const isPaid =
        s === "PAID" ||
        s === "SUCCESSFUL" ||
        paidObligationIds.has(String(ob.id)) ||
        (planId && mid && paidLinkMemberKeys.has(`${planId}::${mid}`));
      if (isPaid && mid) byPlan[planId].paidMemberIds.add(mid);
    }

    // for (const tx of transactions) {
    //   const planId = tx.paymentLink?.id;
    //   if (!planId) continue;
    //   if (!byPlan[planId]) byPlan[planId] = { collected: 0, memberIds: new Set(), paidMemberIds: new Set() };
    //   if (SUCCESS.has((tx.status ?? "").toUpperCase())) {
    //     byPlan[planId].collected += tx.amount ?? 0;
    //   }
    // }
    // A member can end up with multiple SUCCESSFUL transaction rows for the
    // same plan — a known bug where payment initiation doesn't always send a
    // real obligationId, so the backend can't recognize an existing obligation
    // and lets the member pay again on retry. Each row is a genuine charge, but
    // for display purposes a member should only ever be counted once toward
    // "collected" for a given plan — otherwise a single member's repeat
    // payments can make collected exceed what's even possible for the plan.
    const countedPlanMemberPayments = new Set(); // `${planId}::${memberId}`
    for (const tx of transactions) {
      const planId = tx.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId])
        byPlan[planId] = { collected: 0, paidCount: 0, memberIds: new Set() };
      if (!SUCCESS.has((tx.status ?? "").toUpperCase())) continue;

      const mid = String(
        tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "",
      );
      const dedupeKey = mid ? `${planId}::${mid}` : `${planId}::${tx.id}`;
      if (countedPlanMemberPayments.has(dedupeKey)) continue;
      countedPlanMemberPayments.add(dedupeKey);

      byPlan[planId].collected += tx.amount ?? 0;
    }

    const result = {};
    for (const [id, m] of Object.entries(byPlan)) {
      result[id] = {
        collected: m.collected,
        paidCount: m.paidMemberIds.size,
        totalCount: m.memberIds.size,
      };
    }

    // ── TEMPORARY DEBUG — remove after checking ──────────────────────────
    if (import.meta.env.DEV) {
      const anniversaryPlan = plans.find((p) =>
        p.name?.toLowerCase().includes("anniversary"),
      );
      if (anniversaryPlan) {
        const matching = transactions.filter(
          (tx) => String(tx.paymentLink?.id) === String(anniversaryPlan.id),
        );
        console.table(
          matching.map((tx) => ({
            id: tx.id,
            internalReference: tx.internalReference,
            reference: tx.reference,
            status: tx.status,
            obligationId: tx.obligationId,
            memberId: tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id,
            createdAt: tx.createdAt,
            paidAt: tx.paidAt,
            amount: tx.amount,
          })),
        );
      }
    }
    // ── END TEMPORARY DEBUG ───────────────────────────────────────────────
    return result;
  }, [obligations, transactions]);

  const filtered = useMemo(() => {
    if (tab === "Recurring") return plans.filter((p) => p.type === "RECURRING");
    if (tab === "One Time") return plans.filter((p) => p.type !== "RECURRING");
    return plans;
  }, [plans, tab]);

  const stats = useMemo(
    () => ({
      // Use computed collected from transactions (list endpoint metrics are empty)
      collected: Object.values(planMetrics).reduce(
        (sum, m) => sum + (m.collected ?? 0),
        0,
      ),
      active: plans.filter((p) => p.status === "ACTIVE").length,
      yetToPay: plans.reduce((sum, p) => {
        const cm = planMetrics[p.id] ?? {};
        const total = cm.totalCount ?? 0;
        const paid = cm.paidCount ?? 0;
        return sum + Math.max(0, total - paid);
      }, 0),
      failed: plans.filter((p) => p.status === "EXPIRED").length,
    }),
    [plans, planMetrics],
  );

  async function handleCreate(payload) {
    try {
      await planPlans.create.mutateAsync(payload);
      return true;
    } catch (err) {
      notifyError(err, { context: "Create payment plan" });
      return false;
    }
  }

  async function handleSaveEdit(paymentLinkId, payload) {
    try {
      await planPlans.update.mutateAsync({ paymentLinkId, payload });
      setEditingPlan(null);
    } catch (err) {
      notifyError(err, { context: "Update payment plan" });
    }
  }

  return (
    <div
      className="px-4 md:px-6 py-6 overflow-y-auto h-full"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            A full picture of all payments created in your community.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded text-xs font-medium text-white bg-[#002FA7] flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer"
        >
          <Plus size={13} /> Create Payment Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={Wallet}
          label="Total Amount Collected"
          value={formatNaira(stats.collected)}
          color="#002FA7"
          bg="#E6EEFF"
        />
        <StatCard
          icon={ListChecks}
          label="Active Plans"
          value={String(stats.active)}
          color="#dc2626"
          bg="#FFE9EC"
        />
        <StatCard
          icon={Clock}
          label="Yet to pay"
          value={String(stats.yetToPay)}
          color="#b45309"
          bg="#FFF8E7"
        />
        <StatCard
          icon={XCircle}
          label="Failed Payments"
          value={String(stats.failed)}
          color="#7c3aed"
          bg="#F3EEFF"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#EFEFF1] rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded transition-all cursor-pointer border-none font-medium
              ${tab === t ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      {plansLoading ? (
        <p className="text-xs text-gray-400 text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-10">
          No payment plans yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              planPlans={planPlans}
              barColor={BAR_COLORS[i % BAR_COLORS.length]}
              onEdit={setEditingPlan}
              onViewMembers={setViewingMembersPlan}
              metrics={planMetrics[plan.id]}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreatePlanModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
          creating={planPlans.create.isPending}
          createError={
            planPlans.create.error
              ? getErrorMessage(planPlans.create.error)
              : null
          }
        />
      )}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={handleSaveEdit}
          saving={planPlans.update.isPending}
        />
      )}
      {viewingMembersPlan && (
        <PlanMembersModal
          plan={viewingMembersPlan}
          communityId={communityId}
          onClose={() => setViewingMembersPlan(null)}
        />
      )}
    </div>
  );
}
