import { useState } from "react";
import { Plus, Download, Search, ChevronDown, RotateCcw, MoreHorizontal, X, RefreshCw, Zap, Check, ArrowLeft } from "lucide-react";

const PLANS = [
  { name: "Association Dues",           freq: "Monthly",  fColor: "#d4a017", fBg: "#fff8e7", members: "24 / 120", amount: "₦1,200,000", pct: 60, status: "Active",  bar: "#d4a017" },
  { name: "Infrastructure Development", freq: "One-Time", fColor: "#7c3aed", fBg: "#f3eeff", members: "89 / 120", amount: "₦300,000",   pct: 74, status: "Active",  bar: "#7c3aed" },
  { name: "End Of The Year Party",       freq: "Weekly",   fColor: "#059669", fBg: "#ecfdf5", members: "24 / 120", amount: "₦400,500",   pct: 20, status: "Paused",  bar: "#059669" },
  { name: "Emergency Levy",              freq: "One-Time", fColor: "#e11d48", fBg: "#fff1f2", members: "10 / 120", amount: "₦50,000",    pct: 8,  status: "Draft",   bar: "#e11d48" },
];

const PAYMENTS = [
  { name: "Adehayor Okafor", plan: "Association Dues",           dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "adebayor@gmail.com", status: "Paid"    },
  { name: "Chisom Eze",      plan: "Association Dues",           dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "chisom@gmail.com",   status: "Paid"    },
  { name: "Tunde Nwosu",     plan: "Infrastructure Development", dot: "#7c3aed", amount: "₦5,000", date: "Mar 12, 2025", email: "tunde@gmail.com",    status: "Pending" },
  { name: "Blessing Igwe",   plan: "End Of The Year Party",       dot: "#059669", amount: "₦5,000", date: "Mar 12, 2025", email: "blessing@gmail.com", status: "Failed"  },
  { name: "Ibrahim Momoh",   plan: "Association Dues",           dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "ibrahim@gmail.com",  status: "Paid"    },
];

const STATUS_STYLE = { Paid: { bg: "#ecfdf5", color: "#059669" }, Pending: { bg: "#fffbeb", color: "#b45309" }, Failed: { bg: "#fff1f2", color: "#e11d48" } };
const PLAN_STATUS  = { Active: { bg: "#ecfdf5", color: "#059669" }, Paused: { bg: "#fffbeb", color: "#b45309" }, Draft: { bg: "#f5f6fa", color: "#6b7280" } };
const FREQUENCIES  = ["Monthly", "Weekly", "Quarterly", "Annually", "One-Time"];
const REMINDERS    = ["Every Day", "Every 3 Days", "Every Week", "Every 2 Weeks"];

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none transition-all focus:border-[#002FA7]";

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

function Step2({ form, onChange }) {
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3.5">
      <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Plan Name</label><input className={inputCls} value={form.name || ""} placeholder="Enter plan name" onChange={e => onChange("name", e.target.value)} /></div>
      <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Description</label><textarea className={`${inputCls} resize-y`} value={form.description || ""} rows={3} onChange={e => onChange("description", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Amount</label><input type="number" className={inputCls} value={form.amount || ""} placeholder="₦0.00" onChange={e => onChange("amount", e.target.value)} /></div>
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Frequency</label>
          <select className={inputCls} value={form.frequency || ""} onChange={e => onChange("frequency", e.target.value)}>
            <option value="" disabled>Select frequency</option>
            {FREQUENCIES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Start Date</label><input type="date" className={inputCls} value={form.startDate || ""} onChange={e => onChange("startDate", e.target.value)} /></div>
        <div><label className="block text-sm font-semibold text-gray-900 mb-1.5">Due Date</label><input type="date" className={inputCls} value={form.dueDate || ""} onChange={e => onChange("dueDate", e.target.value)} /></div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Applies To</label>
        <select className={inputCls} value={form.appliesTo || ""} onChange={e => onChange("appliesTo", e.target.value)}>
          <option value="" disabled>All Members (209)</option>
          {["All Members (209)", "Specific Members", "Member Tier A", "Member Tier B"].map(o => <option key={o}>{o}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">You can adjust member assignment after creation.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">Auto Reminder</label>
        <select className={inputCls} value={form.reminder || ""} onChange={e => onChange("reminder", e.target.value)}>
          <option value="" disabled>Select reminder frequency</option>
          {REMINDERS.map(o => <option key={o}>{o}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">Sent via SMS and email to unpaid members.</p>
      </div>
    </div>
  );
}

function Step3({ planType, form }) {
  const rows = [
    { label: "Plan Name",   value: form.name || "—" },
    { label: "Plan Type",   value: planType === "recurring" ? "Recurring" : "One Time" },
    { label: "Amount",      value: form.amount ? `₦${Number(form.amount).toLocaleString()}` : "—" },
    { label: "Frequency",   value: form.frequency || "—" },
    { label: "Due Date",    value: form.dueDate || "—" },
    { label: "Applies To",  value: form.appliesTo || "All Members" },
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

function Modal({ onClose }) {
  const [step, setStep]         = useState(1);
  const [planType, setPlanType] = useState("recurring");
  const [success, setSuccess]   = useState(false);
  const [form, setForm]         = useState({ name: "", description: "", amount: "", frequency: "", startDate: "", dueDate: "", appliesTo: "", reminder: "" });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canContinue = step === 1 ? !!planType : step === 2 ? !!(form.name && form.amount && form.frequency) : true;

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
                {step === 2 && <Step2 form={form} onChange={update} />}
                {step === 3 && <Step3 planType={planType} form={form} />}
              </div>
            </>
          )}
        </div>
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="flex items-center gap-1.5 text-sm font-semibold text-[#002FA7]">
              <ArrowLeft size={13} /> {step > 1 ? "Back" : "Cancel"}
            </button>
            <button onClick={() => step < 3 ? setStep(s => s + 1) : setSuccess(true)} disabled={!canContinue}
              className={`px-10 py-2.5 rounded-full text-sm font-bold ${canContinue ? "bg-[#002FA7] text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              {step === 3 ? "Create Plan" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Payments() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const filtered = PAYMENTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.plan.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-6 py-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1d6e]">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage payment plans and track member contributions.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-[#002FA7] text-white text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all">
          <Plus size={14} /> Create Payment Plan
        </button>
      </div>

      {/* Plans table */}
      <div className="bg-white rounded-xl border border-gray-100 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-bold text-[#0f1d6e]">Payment Plans</span>
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">{PLANS.length} plans</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-100">
                {["Plan Name", "Type", "Progress", "Collected", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANS.map((plan, i) => {
                const ps = PLAN_STATUS[plan.status];
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-[#0f1d6e]">{plan.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{plan.members} members paid</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: plan.fColor, background: plan.fBg }}>{plan.freq}</span>
                    </td>
                    <td className="px-5 py-3.5 min-w-32">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
                        <div className="h-full rounded-full" style={{ width: `${plan.pct}%`, background: plan.bar }} />
                      </div>
                      <p className="text-[11px] text-gray-400">{plan.pct}% collected</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-[#0f1d6e]">{plan.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: ps.color, background: ps.bg }}>{plan.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">Edit</button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><MoreHorizontal size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member payments table */}
      <div className="bg-white rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-sm font-bold text-[#0f1d6e]">Member Payments</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div className="flex items-center justify-between px-5 py-3 gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 w-72">
            <Search size={12} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members, payments..." className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            Sort by: <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold text-gray-600">Recent <ChevronDown size={11} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-100">
                {["Members", "Plan", "Amount", "Date", "Email", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const s = STATUS_STYLE[row.status];
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-[#002FA7]">{row.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                        <span className="text-sm text-gray-600">{row.plan}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{row.amount}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{row.date}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{row.email}</td>
                    <td className="px-5 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{row.status}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><RotateCcw size={11} /></button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><MoreHorizontal size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <Modal onClose={() => setModalOpen(false)} />}
    </div>
  );
}