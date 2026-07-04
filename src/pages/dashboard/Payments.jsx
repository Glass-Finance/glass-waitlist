import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  RotateCcw,
  Bell,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { useSlug } from "../../hooks/useSlug";
import { getErrorMessage, notifyError } from "../../utils/errorHandler";
import { getPaymentLinkMembers } from "../../api/payments";

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
const BAR_COLORS = ["#d4a017", "#7c3aed", "#1C2B8A", "#059669"];

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white outline-none transition-all focus:border-[#1C2B8A]";

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
  return new Date(iso).toISOString().split("T")[0];
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
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
                ${done ? "bg-[#1C2B8A] border-[#1C2B8A] text-white" : active ? "border-[#1C2B8A] text-[#1C2B8A] bg-white" : "border-gray-300 text-gray-400 bg-white"}`}
              >
                {done ? <Check size={13} /> : s.n}
              </div>
              <span
                className={`text-[11px] whitespace-nowrap ${active ? "font-semibold text-[#1C2B8A]" : done ? "text-gray-600" : "text-gray-400"}`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-[#1C2B8A]" : "bg-gray-200"}`}
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
      <div className="grid grid-cols-2 gap-3">
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
              className={`p-5 rounded-xl text-left border-2 transition-all relative ${sel ? "border-[#1C2B8A] bg-blue-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div
                className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? "bg-[#1C2B8A] border-[#1C2B8A]" : "border-gray-300"}`}
              >
                {sel && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              <div className="mt-4 mb-2 text-gray-600">{opt.icon}</div>
              <p className="text-xs font-medium text-gray-900">{opt.title}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
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
      <div className="grid grid-cols-2 gap-3">
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
      <div className="grid grid-cols-2 gap-3">
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
              max={form.frequency === "WEEKLY" ? 7 : 28}
              placeholder={form.frequency === "WEEKLY" ? "1–7" : "1–28"}
              onChange={(e) => onChange("billingDay", e.target.value)}
            />
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
      ? new Date(form.startDate).toISOString()
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
            dueAt: new Date(form.dueDate).toISOString(),
          }),
    };
    if (import.meta.env.DEV) console.log("[CreatePlan] payload →", payload);
    const ok = await onCreate(payload);
    if (ok) setSuccess(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
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
                className="px-6 py-2 rounded bg-[#1C2B8A] text-white font-medium text-xs cursor-pointer border-none"
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
              className={`px-6 py-2 rounded text-xs font-medium border-none cursor-pointer ${canContinue ? "bg-[#1C2B8A] text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
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
        ? { startAt: new Date(form.startDate).toISOString() }
        : {}),
    };
    await onSave(plan.id, payload);
  }

  const isReady = form.name && form.amount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
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

          <div className="grid grid-cols-2 gap-3">
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
            className={`grid gap-3 ${isRecurring ? "grid-cols-2" : "grid-cols-1"}`}
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
                  max={form.frequency === "WEEKLY" ? 7 : 28}
                  placeholder={form.frequency === "WEEKLY" ? "1–7" : "1–28"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingDay: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={!isReady || saving}
            className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-[#1C2B8A] hover:opacity-90 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan members modal ────────────────────────────────────────────────────────
function memberStatusStyle(paid, total) {
  if (total === 0) return { bg: "#f5f6fa", color: "#6b7280" };
  if (paid === total) return { bg: "#ecfdf5", color: "#059669" };
  if (paid === 0) return { bg: "#fff1f2", color: "#e11d48" };
  return { bg: "#fffbeb", color: "#b45309" };
}

function PlanMembersModal({ plan, communityId, onClose }) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("Recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["plan-members", communityId, plan.id],
    queryFn: async () => {
      const res = await getPaymentLinkMembers(communityId, plan.id, {
        pageSize: 200,
      });
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : (raw?.content ?? []);
    },
    enabled: !!(communityId && plan.id),
    staleTime: 1000 * 60,
  });
  const members = data ?? [];

  function getName(m) {
    const u = m.member?.user ?? m.user ?? m.member ?? {};
    const f = u.firstName ?? m.firstName ?? "";
    const l = u.lastName ?? m.lastName ?? "";
    return `${f} ${l}`.trim() || u.email || m.email || "Member";
  }
  function getEmail(m) {
    return m.member?.user?.email ?? m.user?.email ?? m.email ?? "—";
  }
  function getJoinedAt(m) {
    return m.member?.joinedAt ?? m.member?.createdAt ?? m.joinedAt ?? null;
  }
  function getPaid(m) {
    return m.paidCount ?? (m.obligationStatus === "PAID" ? 1 : 0);
  }
  function getTotal(m) {
    return m.totalCount ?? 1;
  }

  const filtered = members.filter((m) => {
    const name = getName(m).toLowerCase();
    const email = getEmail(m).toLowerCase();
    const q = search.toLowerCase();
    if (q && !name.includes(q) && !email.includes(q)) return false;
    if (
      statusFilter === "Paid" &&
      !(getPaid(m) === getTotal(m) && getTotal(m) > 0)
    )
      return false;
    if (statusFilter === "Unpaid" && getPaid(m) !== 0) return false;
    if (
      statusFilter === "Partial" &&
      !(getPaid(m) > 0 && getPaid(m) < getTotal(m))
    )
      return false;
    return true;
  });

  const activeChips = statusFilter
    ? [{ key: "status", label: statusFilter }]
    : [];

  function exportCsv() {
    const rows = selected.length
      ? filtered.filter((m) => selected.includes(m.id ?? getName(m)))
      : filtered;
    const header = "Name,Email,Paid,Total,Date Joined\n";
    const body = rows
      .map(
        (m) =>
          `${getName(m)},${getEmail(m)},${getPaid(m)},${getTotal(m)},${formatDate(getJoinedAt(m))}`,
      )
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
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-black">
              Members List ({plan.name})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              You can edit or pause any plan at any time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1C2B8A] text-xs font-semibold text-[#1C2B8A] hover:bg-blue-50 bg-white cursor-pointer"
            >
              Export Csv
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
                    <option>Partial</option>
                    <option>Unpaid</option>
                  </select>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1C2B8A] text-white text-xs font-semibold border-none cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 cursor-pointer"
            >
              Sort by: {sort} <ChevronDown size={11} />
            </button>
            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-100 shadow-lg z-20 overflow-hidden min-w-[140px]">
                  {["Recent", "Name A-Z"].map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setSort(o);
                        setSortOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 px-6 pb-2">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700"
              >
                {chip.label}
                <button
                  onClick={() => setStatusFilter("")}
                  className="bg-transparent border-none cursor-pointer p-0 flex items-center"
                >
                  <X size={10} className="text-gray-400" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setStatusFilter("")}
              className="text-xs font-semibold text-[#1C2B8A] bg-transparent border-none cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
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
                  "Members",
                  "Plans",
                  "Status",
                  "Date",
                  "Email",
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
                    colSpan={8}
                    className="px-5 py-10 text-center text-xs text-gray-400"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const key = m.id ?? i;
                  const paid = getPaid(m),
                    total = getTotal(m);
                  const s = memberStatusStyle(paid, total);
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
                      <td className="px-4 py-3 text-xs font-semibold text-[#1C2B8A]">
                        {getName(m)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {m.planCount ?? total}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: s.color, background: s.bg }}
                        >
                          {paid}/{total} Paid
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(m.lastPaymentDate)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {getEmail(m)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(getJoinedAt(m))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            disabled
                            title="Send reminder — coming soon"
                            className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-300 cursor-not-allowed"
                          >
                            <RotateCcw size={11} />
                          </button>
                          <button
                            disabled
                            className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-300 cursor-not-allowed"
                          >
                            <MoreHorizontal size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
              onClick={() => {
                planPlans.sendReminder.mutate(plan.id);
                close();
              }}
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
function PlanCard({ plan, planPlans, barColor, onEdit, onViewMembers }) {
  const ps = PLAN_STATUS[plan.status] ?? PLAN_STATUS.DRAFT;

  const freqLabel =
    plan.type === "RECURRING"
      ? (FREQUENCIES.find((f) => f.value === plan.frequency)?.label ??
        plan.frequency ??
        "Recurring")
      : "One-Time";

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4"
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
        {plan.name}
      </p>

      {/* Amount + frequency + collected */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[22px] font-extrabold text-gray-900 leading-none">
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
            {formatCompact(plan.amountCollected)}
          </span>
          /{formatCompact(plan.expectedAmount)} Collected
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${plan.pct}%`, background: barColor }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            {plan.paidCount} / {plan.totalCount} members paid
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
  const communityId = useActiveCommunityId();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingMembersPlan, setViewingMembersPlan] = useState(null);
  const [tab, setTab] = useState("All Plans");

  const planPlans = usePaymentPlans(communityId);
  const { plans, isLoading: plansLoading } = planPlans;

  const filtered = useMemo(() => {
    if (tab === "Recurring") return plans.filter((p) => p.type === "RECURRING");
    if (tab === "One Time") return plans.filter((p) => p.type !== "RECURRING");
    return plans;
  }, [plans, tab]);

  const stats = useMemo(
    () => ({
      collected: plans.reduce((sum, p) => sum + (p.amountCollected ?? 0), 0),
      active: plans.filter((p) => p.status === "ACTIVE").length,
      yetToPay: plans.reduce(
        (sum, p) => sum + (p.unpaidCount ?? 0) + (p.partialCount ?? 0),
        0,
      ),
      failed: plans.filter((p) => p.status === "EXPIRED").length,
    }),
    [plans],
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
    <div className="px-6 py-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            A full picture of all payments created in your community.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded text-xs font-medium text-white bg-[#1C2B8A] flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer"
        >
          <Plus size={13} /> Create Payment Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={Wallet}
          label="Total Amount Collected"
          value={formatNaira(stats.collected)}
          color="#1C2B8A"
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
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              planPlans={planPlans}
              barColor={BAR_COLORS[i % BAR_COLORS.length]}
              onEdit={setEditingPlan}
              onViewMembers={setViewingMembersPlan}
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
