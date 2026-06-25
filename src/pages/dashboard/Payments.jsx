import { useMemo, useState } from "react";
import { Plus, MoreHorizontal, X, RefreshCw, Zap, Check, ArrowLeft, Loader2, Wallet, ListChecks, Clock, XCircle } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunity";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { useSlug } from "../../hooks/useSlug";

const PLAN_STATUS = {
  ACTIVE:   { bg: "#ecfdf5", color: "#059669", label: "Active" },
  PAUSED:   { bg: "#fffbeb", color: "#b45309", label: "Paused" },
  DRAFT:    { bg: "#f5f6fa", color: "#6b7280", label: "Draft" },
  EXPIRED:  { bg: "#fff1f2", color: "#e11d48", label: "Inactive" },
  ARCHIVED: { bg: "#fff1f2", color: "#e11d48", label: "Inactive" },
};
const FREQUENCIES = [{ label: "Monthly", value: "MONTHLY" }, { label: "Weekly", value: "WEEKLY" }, { label: "Quarterly", value: "QUARTERLY" }, { label: "Annually", value: "YEARLY" }];
const REMINDERS   = ["Every Day", "Every 3 Days", "Every Week", "Every 2 Weeks"];
const TABS = ["All Plans", "Recurring", "One Time"];
const BAR_COLORS = ["#d4a017", "#7c3aed", "#1C2B8A", "#059669"];

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none transition-all focus:border-[#002FA7]";

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount ?? 0).replace("NGN", "₦");
}
function formatCompact(amount) {
  return new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(amount ?? 0);
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center justify-between" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-base font-bold text-[#0f1d6e]">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
  );
}

function StepIndicator({ current }) {
  const steps = [{ n: 1, label: "Plan Type" }, { n: 2, label: "Plan Details" }, { n: 3, label: "Review" }];
  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i) => {
        const done = s.n < current, active = s.n === current;
        return (
          <div key={s.n} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${done ? "bg-[#002FA7] border-[#002FA7] text-white" : active ? "border-[#002FA7] text-[#002FA7] bg-white" : "border-gray-300 text-gray-400 bg-white"}`}>
                {done ? <Check size={13} /> : s.n}
              </div>
              <span className={`text-[11px] whitespace-nowrap ${active ? "font-semibold text-[#002FA7]" : done ? "text-gray-600" : "text-gray-400"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-[#002FA7]" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ value, onChange }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">Choose the type of plan you want to create</p>
      <div className="grid grid-cols-2 gap-3">
        {[{ id: "recurring", icon: <RefreshCw size={22} />, title: "Recurring", desc: "Members pay on a set schedule." },
          { id: "one_time",  icon: <Zap size={22} />,       title: "One Time",  desc: "A single payment for one purpose." }].map(opt => {
          const sel = value === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)}
              className={`p-5 rounded-xl text-left border-2 transition-all relative ${sel ? "border-[#002FA7] bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
              <div className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? "bg-[#002FA7] border-[#002FA7]" : "border-gray-300"}`}>
                {sel && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              <div className="mt-4 mb-2 text-gray-600">{opt.icon}</div>
              <p className="text-sm font-bold text-gray-900">{opt.title}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step2({ planType, form, onChange, slugState }) {
  const { slug, setSlug, available, checking, suggesting, suggestFrom } = slugState;
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3.5">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Plan Name</label>
        <input className={inputCls} value={form.name || ""} placeholder="Enter plan name"
          onChange={e => onChange("name", e.target.value)}
          onBlur={() => !slug && suggestFrom(form.name)} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">URL slug</label>
        <div className="relative">
          <input className={inputCls + " pr-8"} value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="e.g. alumni-dues-2026" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {(checking || suggesting) && <Loader2 size={14} className="animate-spin text-gray-400" />}
            {!checking && !suggesting && available === true && <Check size={14} className="text-green-600" />}
            {!checking && !suggesting && available === false && <X size={14} className="text-red-500" />}
          </span>
        </div>
        {available === false && !checking && <p className="text-xs text-red-500 mt-1">That URL is taken — try another.</p>}
      </div>
      <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Description</label><textarea className={`${inputCls} resize-y`} value={form.description || ""} rows={3} onChange={e => onChange("description", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Amount</label><input type="number" className={inputCls} value={form.amount || ""} placeholder="₦0.00" onChange={e => onChange("amount", e.target.value)} /></div>
        {planType === "recurring" && (
          <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Frequency</label>
            <select className={inputCls} value={form.frequency || ""} onChange={e => onChange("frequency", e.target.value)}>
              <option value="" disabled>Select frequency</option>
              {FREQUENCIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Start Date</label><input type="date" className={inputCls} value={form.startDate || ""} onChange={e => onChange("startDate", e.target.value)} /></div>
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Due Date</label><input type="date" className={inputCls} value={form.dueDate || ""} onChange={e => onChange("dueDate", e.target.value)} /></div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Auto Reminder</label>
        <select className={inputCls} value={form.reminder || ""} onChange={e => onChange("reminder", e.target.value)}>
          <option value="" disabled>Select reminder frequency</option>
          {REMINDERS.map(o => <option key={o}>{o}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">Sent via SMS and email to unpaid members.</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.activateImmediately ?? true} onChange={e => onChange("activateImmediately", e.target.checked)} />
        Activate immediately after creation
      </label>
    </div>
  );
}

function Step3({ planType, form, slug }) {
  const rows = [
    { label: "Plan Name",   value: form.name || "—" },
    { label: "URL slug",    value: slug || "—" },
    { label: "Plan Type",   value: planType === "recurring" ? "Recurring" : "One Time" },
    { label: "Amount",      value: form.amount ? formatNaira(Number(form.amount)) : "—" },
    ...(planType === "recurring" ? [{ label: "Frequency", value: form.frequency || "—" }] : []),
    { label: "Due Date",    value: form.dueDate || "—" },
    { label: "Activate",    value: (form.activateImmediately ?? true) ? "Immediately" : "Manually later" },
  ];
  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden mb-3">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? "border-b border-gray-100" : ""} ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
            <span className="text-gray-500 w-36">{r.label}</span>
            <span className="font-semibold text-gray-900">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-gray-700">
        Once created, assigned members will receive a notification.
      </div>
    </div>
  );
}

function CreatePlanModal({ onClose, onCreate, creating, createError }) {
  const [step, setStep]         = useState(1);
  const [planType, setPlanType] = useState("recurring");
  const [success, setSuccess]   = useState(false);
  const [form, setForm]         = useState({ name: "", description: "", amount: "", frequency: "", startDate: "", dueDate: "", reminder: "", activateImmediately: true });
  const slugState = useSlug("PAYMENT_LINK");
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canContinue = step === 1
    ? !!planType
    : step === 2
      ? !!(form.name && form.amount && slugState.slug && (planType === "one_time" || form.frequency))
      : true;

  async function handleSubmit() {
    const payload = {
      title: form.name,
      description: form.description,
      amount: Number(form.amount),
      paymentType: planType === "recurring" ? "RECURRING" : "ONE_TIME",
      slug: slugState.slug,
      activateImmediately: form.activateImmediately ?? true,
      ...(planType === "recurring" ? { frequency: form.frequency } : {}),
      ...(form.dueDate ? { dueAt: form.dueDate } : {}),
    };
    const ok = await onCreate(payload);
    if (ok) setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <h2 className="text-base font-extrabold text-[#0f1d6e]">Create Payment Plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">You can edit or pause any plan at any time.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"><X size={14} /></button>
        </div>
        <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
          {success ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check size={24} className="text-green-600" strokeWidth={2.5} /></div>
              <h3 className="text-lg font-extrabold text-[#0f1d6e] mb-2">Plan Created!</h3>
              <p className="text-sm text-gray-500 mb-6">Members have been notified.</p>
              <button onClick={onClose} className="px-8 py-2.5 rounded-full bg-[#002FA7] text-white font-bold text-sm">Done</button>
            </div>
          ) : (
            <>
              <StepIndicator current={step} />
              <div className="flex-1 overflow-y-auto">
                {step === 1 && <Step1 value={planType} onChange={setPlanType} />}
                {step === 2 && <Step2 planType={planType} form={form} onChange={update} slugState={slugState} />}
                {step === 3 && <Step3 planType={planType} form={form} slug={slugState.slug} />}
              </div>
              {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
            </>
          )}
        </div>
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="flex items-center gap-1.5 text-sm font-semibold text-[#002FA7] bg-transparent border-none cursor-pointer">
              <ArrowLeft size={13} /> {step > 1 ? "Back" : "Cancel"}
            </button>
            <button
              onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
              disabled={!canContinue || creating || slugState.checking || slugState.available === false}
              className={`px-10 py-2.5 rounded-full text-sm font-bold border-none cursor-pointer ${canContinue ? "bg-[#002FA7] text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              {creating ? "Creating…" : step === 3 ? "Create Plan" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanActionsMenu({ plan, planPlans }) {
  const [open, setOpen] = useState(false);
  const status = plan.status;

  const actions = [];
  if (status === "DRAFT") actions.push({ label: "Activate", run: () => planPlans.activate.mutate(plan.id) });
  if (status === "ACTIVE") actions.push({ label: "Pause", run: () => planPlans.pause.mutate(plan.id) });
  if (status === "PAUSED") actions.push({ label: "Resume", run: () => planPlans.resume.mutate(plan.id) });
  if (status === "ACTIVE" || status === "PAUSED") actions.push({ label: "Expire", run: () => planPlans.expire.mutate(plan.id) });
  if (status !== "ARCHIVED") actions.push({ label: "Archive", run: () => planPlans.archive.mutate(plan.id) });
  actions.push({ label: "Duplicate", run: () => planPlans.duplicate.mutate(plan.id) });

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="w-7 h-7 rounded-lg border-none bg-transparent flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-100 shadow-lg z-20 overflow-hidden min-w-[120px]">
            {actions.map(a => (
              <button key={a.label} onClick={() => { a.run(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({ plan, planPlans, barColor }) {
  const ps = PLAN_STATUS[plan.status] ?? PLAN_STATUS.DRAFT;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5" style={{ color: ps.color, background: ps.bg }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ps.color }} />
          {ps.label}
        </span>
        <PlanActionsMenu plan={plan} planPlans={planPlans} />
      </div>

      <p className="text-sm font-bold text-[#0f1d6e] mb-2">{plan.name}</p>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-gray-900">{formatNaira(plan.amount)}</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#7c3aed", background: "#f3eeff" }}>
            {plan.type === "RECURRING" ? (plan.frequency ?? "Recurring") : "One-Time"}
          </span>
        </div>
        <span className="text-sm font-bold text-gray-800">
          {formatCompact(plan.amountCollected)}/{formatCompact(plan.expectedAmount)} Collected
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-1.5">
        <div className="h-full rounded-full" style={{ width: `${plan.pct}%`, background: barColor }} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{plan.paidCount} / {plan.totalCount} members paid</p>
        <p className="text-xs text-gray-400">Due {plan.dueAt ? new Date(plan.dueAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}</p>
      </div>
    </div>
  );
}

export default function Payments() {
  const communityId = useActiveCommunityId();
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("All Plans");

  const planPlans = usePaymentPlans(communityId);
  const { plans, isLoading: plansLoading } = planPlans;

  const filtered = useMemo(() => {
    if (tab === "Recurring") return plans.filter((p) => p.type === "RECURRING");
    if (tab === "One Time") return plans.filter((p) => p.type !== "RECURRING");
    return plans;
  }, [plans, tab]);

  const stats = useMemo(() => ({
    collected: plans.reduce((sum, p) => sum + (p.amountCollected ?? 0), 0),
    active: plans.filter((p) => p.status === "ACTIVE").length,
    yetToPay: plans.reduce((sum, p) => sum + (p.unpaidCount ?? 0) + (p.partialCount ?? 0), 0),
    failed: plans.filter((p) => p.status === "EXPIRED").length,
  }), [plans]);

  async function handleCreate(payload) {
    try {
      await planPlans.create.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div className="px-6 py-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1d6e]">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage payment plans and track member contributions.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-[#002FA7] text-white text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer">
          <Plus size={14} /> Create Payment Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard icon={Wallet} label="Total Amount Collected" value={formatNaira(stats.collected)} color="#002FA7" bg="#E6EEFF" />
        <StatCard icon={ListChecks} label="Active Plans" value={String(stats.active).padStart(2, "0")} color="#dc2626" bg="#FFE9EC" />
        <StatCard icon={Clock} label="Yet to pay" value={String(stats.yetToPay)} color="#b45309" bg="#FFF8E7" />
        <StatCard icon={XCircle} label="Failed Payments" value={String(stats.failed).padStart(2, "0")} color="#7c3aed" bg="#F3EEFF" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#EFEFF1] rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-[13px] rounded transition-all cursor-pointer border-none font-medium ${tab === t ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      {plansLoading ? (
        <p className="text-xs text-gray-400 text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-10">No payment plans yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} planPlans={planPlans} barColor={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </div>
      )}

      {modalOpen && (
        <CreatePlanModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
          creating={planPlans.create.isPending}
          createError={planPlans.create.error?.response?.data?.message}
        />
      )}
    </div>
  );
}
