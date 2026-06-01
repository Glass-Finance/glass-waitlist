import { useState } from "react";
import {
  Info,
  Download,
  RotateCcw,
  MoreHorizontal,
  Plus,
  ChevronDown,
  Search,
  X,
  ArrowLeft,
  RefreshCw,
  Zap,
  Check,
} from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";

// ─── Mock data ────────────────────────────────────────────────────────────────
const stats = [
  {
    label: "Total Members",
    value: "209",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="#002FA7" strokeWidth="1.8" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Inactive Members",
    value: "12",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#e85d04" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="#e85d04" strokeWidth="1.8" />
        <line x1="17" y1="11" x2="23" y2="17" stroke="#e85d04" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="23" y1="11" x2="17" y2="17" stroke="#e85d04" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Total Contributions",
    value: "₦ 2,002,490",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#d4a017" strokeWidth="1.8" />
        <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15" stroke="#d4a017" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Active Plans",
    value: "05",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#7c3aed" strokeWidth="1.8" />
        <path d="M2 10h20M6 15h4" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

const plans = [
  { name: "Association Dues",        freq: "Monthly",  fColor: "#d4a017", fBg: "#fff8e7", members: "24 / 120", amount: "₦1.2M",    pct: 60, bar: "#d4a017" },
  { name: "Infrastructure Development", freq: "One-Time", fColor: "#7c3aed", fBg: "#f3eeff", members: "24 / 120", amount: "₦300,000", pct: 60, bar: "#7c3aed" },
  { name: "End Of The Year Party",   freq: "Weekly",   fColor: "#059669", fBg: "#ecfdf5", members: "24 / 120", amount: "₦400,500", pct: 60, bar: "#059669" },
];

const activity = [
  { name: "Joseph Alabi",  action: "paid",                  detail: "₦20,200 for Infrastructure...", time: "5 hours ago", type: "payment",  aColor: "#059669", aBg: "#ecfdf5" },
  { name: "Grace Adekunle", action: "joined the community", detail: "",                               time: "5 hours ago", type: "member",   aColor: "#002FA7", aBg: "#e6eeff" },
  { name: "Emeka Nwosu",   action: "paid Event Fee",         detail: "₦15,000",                       time: "5 hours ago", type: "payment",  aColor: "#059669", aBg: "#ecfdf5" },
  { name: null,            action: "Dues Reminder Sent to",  detail: "12 members",                    time: "5 hours ago", type: "reminder", aColor: "#d4a017", aBg: "#fff8e7" },
];

const payments = [
  { name: "Adehayor Okafor", plan: "Associatio...", dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "adebayor@gmail.com",  status: "Paid"    },
  { name: "Chisom Eze",      plan: "Associatio...", dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "chisom@gmail.com",     status: "Paid"    },
  { name: "Tunde Nwosu",     plan: "Infrastruct...",dot: "#7c3aed", amount: "₦5,000", date: "Mar 12, 2025", email: "tunde@gmail.com",      status: "Pending" },
  { name: "Blessing Igwe",   plan: "End Of The..", dot: "#059669", amount: "₦5,000", date: "Mar 12, 2025", email: "blessing@gmail.com",   status: "Failed"  },
  { name: "Ibrahim Momoh",   plan: "Associatio...", dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "ibrahim@gmail.com",    status: "Paid"    },
  { name: "Habeeb Abayomi",  plan: "End Of The..", dot: "#059669", amount: "₦5,000", date: "Mar 12, 2025", email: "habeeb@gmail.com",     status: "Failed"  },
  { name: "Fatima Abdullah", plan: "Infrastruct...",dot: "#7c3aed", amount: "₦5,000", date: "Mar 12, 2025", email: "fatima@gmail.com",     status: "Pending" },
  { name: "Kune Martins",    plan: "End Of The..", dot: "#059669", amount: "₦5,000", date: "Mar 12, 2025", email: "kune@gmail.com",       status: "Failed"  },
];

const STATUS = {
  Paid:    { bg: "#ecfdf5", color: "#059669" },
  Pending: { bg: "#fffbeb", color: "#b45309" },
  Failed:  { bg: "#fff1f2", color: "#e11d48" },
};

// ─── Shared modal constants ────────────────────────────────────────────────────
const FREQUENCIES = ["Monthly", "Weekly", "Quarterly", "Annually", "One-Time"];
const REMINDERS   = ["Every Day", "Every 3 Days", "Every Week", "Every 2 Weeks"];

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid #e5e7eb",
  fontSize: 13,
  color: "#374151",
  background: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color .15s",
};

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: "Plan Type" },
    { n: 2, label: "Plan Details" },
    { n: 3, label: "Review" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {steps.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12,
                border: done || active ? "2px solid #002FA7" : "2px solid #d1d5db",
                background: done ? "#002FA7" : "#fff",
                color: done ? "#fff" : active ? "#002FA7" : "#9ca3af",
              }}>
                {done ? <Check size={13} /> : s.n}
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: active ? 600 : 500,
                color: active ? "#002FA7" : done ? "#374151" : "#9ca3af",
                whiteSpace: "nowrap",
              }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 8px", marginBottom: 18,
                background: done ? "#002FA7" : "#e5e7eb",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

// ─── Step 1 — Plan Type ────────────────────────────────────────────────────────
function Step1({ value, onChange }) {
  const options = [
    { id: "recurring", icon: <RefreshCw size={24} color="#374151" />, title: "Recurring",  desc: "Members pay on a set schedule." },
    { id: "one_time",  icon: <Zap        size={24} color="#374151" />, title: "One Time",  desc: "A single payment for one purpose." },
  ];
  return (
    <div>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        Choose the type of plan you want to create
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {options.map((opt) => {
          const sel = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                padding: "22px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                border: sel ? "2px solid #002FA7" : "1.5px solid #e5e7eb",
                background: sel ? "#f0f4ff" : "#fafafa",
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
                transition: "all .15s", position: "relative",
              }}
            >
              {/* radio dot */}
              <div style={{
                position: "absolute", top: 11, left: 11,
                width: 18, height: 18, borderRadius: "50%",
                border: sel ? "none" : "1.5px solid #d1d5db",
                background: sel ? "#002FA7" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sel && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <div style={{ marginTop: 12 }}>{opt.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2 — Plan Details ─────────────────────────────────────────────────────
function Step2({ form, onChange }) {
  const handleFocus = (e) => (e.target.style.borderColor = "#002FA7");
  const handleBlur  = (e) => (e.target.style.borderColor = "#e5e7eb");

  return (
    <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
      <Field label="Plan Name">
        <input
          type="text"
          value={form.name}
          placeholder="Enter plan name"
          onChange={(e) => onChange("name", e.target.value)}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          placeholder="Briefly describe what this payment plan covers..."
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Amount Per Member">
          <input
            type="number"
            value={form.amount}
            placeholder="₦0.00"
            onChange={(e) => onChange("amount", e.target.value)}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Field>

        <Field label="Frequency">
          <div style={{ position: "relative" }}>
            <select
              value={form.frequency}
              onChange={(e) => onChange("frequency", e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.frequency ? "#374151" : "#9ca3af" }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="" disabled>Select frequency</option>
              {FREQUENCIES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Start Date">
          <input type="date" value={form.startDate} onChange={(e) => onChange("startDate", e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
        </Field>
        <Field label="Due Date">
          <input type="date" value={form.dueDate} onChange={(e) => onChange("dueDate", e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
        </Field>
      </div>

      <Field label="Applies To" hint="You can adjust member assignment after the plan is created.">
        <div style={{ position: "relative" }}>
          <select
            value={form.appliesTo}
            onChange={(e) => onChange("appliesTo", e.target.value)}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.appliesTo ? "#374151" : "#9ca3af" }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="" disabled>All Members (209)</option>
            {["All Members (209)", "Specific Members", "Member Tier A", "Member Tier B"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Field>

      <Field label="Set Auto Reminder" hint="Reminders are sent via SMS and email to unpaid members.">
        <div style={{ position: "relative" }}>
          <select
            value={form.reminder}
            onChange={(e) => onChange("reminder", e.target.value)}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.reminder ? "#374151" : "#9ca3af" }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="" disabled>Select reminder frequency</option>
            {REMINDERS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Field>
    </div>
  );
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────
function Step3({ planType, form }) {
  const rows = [
    { label: "Plan Name",        value: form.name        || "—" },
    { label: "Plan Type",        value: planType === "recurring" ? "Recurring" : "One Time" },
    { label: "Amount Per Member",value: form.amount ? `₦${Number(form.amount).toLocaleString()}` : "—" },
    { label: "Frequency",        value: form.frequency   || "—" },
    { label: "Due Date",         value: form.dueDate     || "—" },
    { label: "Applies To",       value: form.appliesTo   || "All Members" },
    { label: "Description",      value: form.description || "—" },
  ];
  return (
    <div>
      <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 14 }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "11px 15px",
            background: i % 2 === 0 ? "#fafafa" : "#fff",
            borderBottom: i < rows.length - 1 ? "1px solid #f3f4f8" : "none",
          }}>
            <span style={{ fontSize: 13, color: "#6b7280", flex: "0 0 140px" }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right", flex: 1 }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f0f4ff", border: "1px solid #c7d2fe", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
        Once created, assigned members will receive a notification. You can edit or pause this plan at any time.
      </div>
    </div>
  );
}

// ─── Success state ─────────────────────────────────────────────────────────────
function SuccessState({ onClose }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <Check size={26} color="#059669" strokeWidth={2.5} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f1d6e", marginBottom: 8 }}>Plan Created Successfully!</h3>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 26, lineHeight: 1.6 }}>
        Members assigned to this plan have been notified. Manage it from the Payments page.
      </p>
      <button
        onClick={onClose}
        style={{ padding: "11px 32px", borderRadius: 99, border: "none", background: "#002FA7", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
      >
        Done
      </button>
    </div>
  );
}

// ─── Create Payment Plan Modal ────────────────────────────────────────────────
function CreatePaymentPlanModal({ onClose }) {
  const [step, setStep]       = useState(1);
  const [planType, setPlanType] = useState("recurring");
  const [success, setSuccess]  = useState(false);
  const [form, setForm]        = useState({
    name: "", description: "", amount: "", frequency: "",
    startDate: "", dueDate: "", appliesTo: "", reminder: "",
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canContinue =
    step === 1 ? !!planType :
    step === 2 ? !!(form.name && form.amount && form.frequency) :
    true;

  // Close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,29,110,0.2)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 660,
          boxShadow: "0 20px 60px rgba(15,29,110,0.16)",
          maxHeight: "90vh", display: "flex", flexDirection: "column",
          animation: "modalIn .2s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "22px 26px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f1d6e", margin: 0 }}>Create Payment Plan</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>You can edit or pause any plan at any time.</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 26px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {success ? (
            <SuccessState onClose={onClose} />
          ) : (
            <>
              <StepIndicator current={step} />
              <div style={{ flex: 1, overflowY: "auto" }}>
                {step === 1 && <Step1 value={planType} onChange={setPlanType} />}
                {step === 2 && <Step2 form={form} onChange={update} />}
                {step === 3 && <Step3 planType={planType} form={form} />}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div style={{ padding: "14px 26px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f3f4f8" }}>
            <button
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 18px", borderRadius: 99, border: "none", background: "transparent", color: "#002FA7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <ArrowLeft size={13} /> {step > 1 ? "Back" : "Cancel"}
            </button>
            <button
              onClick={() => step < 3 ? setStep((s) => s + 1) : setSuccess(true)}
              disabled={!canContinue}
              style={{
                padding: "10px 44px", borderRadius: 99, border: "none",
                background: canContinue ? "#002FA7" : "#e5e7eb",
                color: canContinue ? "#fff" : "#9ca3af",
                fontSize: 13, fontWeight: 700,
                cursor: canContinue ? "pointer" : "not-allowed",
                transition: "all .15s",
              }}
            >
              {step === 3 ? "Create Plan" : "Continue"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ─── Add Member — Coming Soon modal ──────────────────────────────────────────
function AddMemberModal({ onClose }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,29,110,0.2)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380,
        boxShadow: "0 20px 60px rgba(15,29,110,0.16)",
        padding: "40px 36px", textAlign: "center",
        animation: "modalIn .2s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" stroke="#002FA7" strokeWidth="1.8" />
            <line x1="19" y1="8"  x2="19" y2="14" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="16" y1="11" x2="22" y2="11" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f1d6e", marginBottom: 8 }}>Add Member</h3>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 26 }}>
          This feature is coming soon! You'll be able to invite and onboard new members directly from the dashboard.
        </p>
        <button
          onClick={onClose}
          style={{ padding: "11px 32px", borderRadius: 99, border: "none", background: "#002FA7", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Got it
        </button>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [search, setSearch]             = useState("");
  const [paymentPlanOpen, setPaymentPlanOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen]     = useState(false);

  const filtered = payments.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.plan.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FC", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar searchPlaceholder="Search payments, plans, members..." />

        <main style={{ flex: 1, padding: "24px 24px 48px", overflowY: "auto" }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f1d6e", margin: 0 }}>Dashboard</h1>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                A full picture of your community's financial activity.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {/* ── Create Payment Plan ── */}
              <button
                onClick={() => setPaymentPlanOpen(true)}
                style={{
                  padding: "9px 18px", borderRadius: 8,
                  border: "1.5px solid #e0e3f0", background: "#fff",
                  color: "#0f1d6e", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6fa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                Create Payment Plan
              </button>

              {/* ── Add Member ── */}
              <button
                onClick={() => setAddMemberOpen(true)}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "none",
                  background: "#002FA7", color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "opacity .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={15} /> Add Member
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
            {stats.map(({ label, value, icon }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #eef0f8", boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
                  <Info size={13} color="#c4c9e0" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {icon}
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#0f1d6e" }}>{value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Plans + Recent Activity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>

            {/* Payment Plans */}
            <div style={{ borderRadius: 12, border: "1px solid #eef0f8", padding: "18px", boxShadow: "0 1px 4px rgba(0,47,167,0.05)", background: "rgba(204,219,255,0.4)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1d6e" }}>Payment Plans</span>
                <button style={{ fontSize: 12, fontWeight: 600, color: "#002FA7", background: "none", border: "none", cursor: "pointer" }}>
                  Manage All
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {plans.map((p) => (
                  <div key={p.name} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid rgba(204,219,255,0.6)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1d6e" }}>{p.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: p.fColor, background: p.fBg, borderRadius: 99, padding: "2px 8px" }}>{p.freq}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f1d6e" }}>{p.amount}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 7 }}>{p.members} members paid</div>
                    <div style={{ height: 5, borderRadius: 99, background: "#eef0f8", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.pct}%`, background: p.bar, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{p.pct}% Collected</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eef0f8", padding: "18px", boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1d6e", display: "block", marginBottom: 14 }}>Recent Activity</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: i < activity.length - 1 ? "1px solid #f3f4f8" : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: a.aBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {a.type === "payment" && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke={a.aColor} strokeWidth="1.8" />
                          <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15" stroke={a.aColor} strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      )}
                      {a.type === "member" && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={a.aColor} strokeWidth="1.8" strokeLinecap="round" />
                          <circle cx="12" cy="7" r="4" stroke={a.aColor} strokeWidth="1.8" />
                        </svg>
                      )}
                      {a.type === "reminder" && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={a.aColor} strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={a.aColor} strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>
                        {a.name && <strong style={{ color: "#002FA7", fontWeight: 700 }}>{a.name} </strong>}
                        {a.action}{" "}
                        {a.detail && <strong style={{ color: "#0f1d6e" }}>{a.detail}</strong>}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.8" />
                          <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Member Payments table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eef0f8", boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
            <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f1d6e" }}>Member Payments</span>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e0e3f0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Download size={13} /> Export CSV
              </button>
            </div>

            <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5f6fa", borderRadius: 8, padding: "7px 12px", border: "1px solid #eef0f8", width: 300 }}>
                <Search size={13} color="#9ca3af" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members, payments, receipts..."
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Sort by:</span>
                <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: "1px solid #e0e3f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                  Recent <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderTop: "1px solid #eef0f8", borderBottom: "1px solid #eef0f8" }}>
                    {["Members", "Plan", "Amount", "Date", "Email", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const s = STATUS[row.status];
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #f3f4f8", cursor: "default" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#002FA7", cursor: "pointer" }}>{row.name}</span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.dot, display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "#374151" }}>{row.plan}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: "#374151" }}>{row.amount}</td>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: "#374151" }}>{row.date}</td>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: "#374151" }}>{row.email}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 99, padding: "3px 10px" }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e0e3f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                              <RotateCcw size={12} />
                            </button>
                            <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e0e3f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                              <MoreHorizontal size={12} />  
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {paymentPlanOpen && <CreatePaymentPlanModal onClose={() => setPaymentPlanOpen(false)} />}
      {addMemberOpen   && <AddMemberModal         onClose={() => setAddMemberOpen(false)}   />}
    </div>
  );
}