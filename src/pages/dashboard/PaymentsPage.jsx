import { useState } from "react";
import {
  Plus,
  Download,
  Search,
  ChevronDown,
  RotateCcw,
  MoreHorizontal,
  X,
  RefreshCw,
  Zap,
  Check,
  ArrowLeft,
} from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";

// ── Inter font injection (if not already in index.css) ───────────────────────
// Add this to your index.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

const FONT = { fontFamily: "Inter, sans-serif" };

// ─── Mock data ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Association Dues",
    freq: "Monthly",
    fColor: "#d4a017",
    fBg: "#fff8e7",
    members: "24 / 120",
    amount: "₦1,200,000",
    pct: 60,
    status: "Active",
    bar: "#d4a017",
  },
  {
    name: "Infrastructure Development",
    freq: "One-Time",
    fColor: "#7c3aed",
    fBg: "#f3eeff",
    members: "89 / 120",
    amount: "₦300,000",
    pct: 74,
    status: "Active",
    bar: "#7c3aed",
  },
  {
    name: "End Of The Year Party",
    freq: "Weekly",
    fColor: "#059669",
    fBg: "#ecfdf5",
    members: "24 / 120",
    amount: "₦400,500",
    pct: 20,
    status: "Paused",
    bar: "#059669",
  },
  {
    name: "Emergency Levy",
    freq: "One-Time",
    fColor: "#e11d48",
    fBg: "#fff1f2",
    members: "10 / 120",
    amount: "₦50,000",
    pct: 8,
    status: "Draft",
    bar: "#e11d48",
  },
];

const PAYMENTS = [
  {
    name: "Adehayor Okafor",
    plan: "Association Dues",
    dot: "#d4a017",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "adebayor@gmail.com",
    status: "Paid",
  },
  {
    name: "Chisom Eze",
    plan: "Association Dues",
    dot: "#d4a017",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "chisom@gmail.com",
    status: "Paid",
  },
  {
    name: "Tunde Nwosu",
    plan: "Infrastructure Development",
    dot: "#7c3aed",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "tunde@gmail.com",
    status: "Pending",
  },
  {
    name: "Blessing Igwe",
    plan: "End Of The Year Party",
    dot: "#059669",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "blessing@gmail.com",
    status: "Failed",
  },
  {
    name: "Ibrahim Momoh",
    plan: "Association Dues",
    dot: "#d4a017",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "ibrahim@gmail.com",
    status: "Paid",
  },
  {
    name: "Habeeb Abayomi",
    plan: "End Of The Year Party",
    dot: "#059669",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "habeeb@gmail.com",
    status: "Failed",
  },
  {
    name: "Fatima Abdullah",
    plan: "Infrastructure Development",
    dot: "#7c3aed",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "fatima@gmail.com",
    status: "Pending",
  },
  {
    name: "Kune Martins",
    plan: "End Of The Year Party",
    dot: "#059669",
    amount: "₦5,000",
    date: "Mar 12, 2025",
    email: "kune@gmail.com",
    status: "Failed",
  },
];

const STATUS_STYLE = {
  Paid: { bg: "#ecfdf5", color: "#059669" },
  Pending: { bg: "#fffbeb", color: "#b45309" },
  Failed: { bg: "#fff1f2", color: "#e11d48" },
};

const PLAN_STATUS_STYLE = {
  Active: { bg: "#ecfdf5", color: "#059669" },
  Paused: { bg: "#fffbeb", color: "#b45309" },
  Draft: { bg: "#f5f6fa", color: "#6b7280" },
};

const FREQUENCIES = ["Monthly", "Weekly", "Quarterly", "Annually", "One-Time"];
const REMINDERS = ["Every Day", "Every 3 Days", "Every Week", "Every 2 Weeks"];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: "Plan Type" },
    { n: 2, label: "Plan Details" },
    { n: 3, label: "Review" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div
            key={s.n}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < steps.length - 1 ? 1 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  ...FONT,
                  border:
                    done || active ? "2px solid #002FA7" : "2px solid #d1d5db",
                  background: done ? "#002FA7" : "#fff",
                  color: done ? "#fff" : active ? "#002FA7" : "#9ca3af",
                }}
              >
                {done ? <Check size={13} /> : s.n}
              </div>
              <span
                style={{
                  fontSize: 11,
                  ...FONT,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#002FA7" : done ? "#374151" : "#9ca3af",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: "0 8px",
                  marginBottom: 18,
                  background: done ? "#002FA7" : "#e5e7eb",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared input helpers ─────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: 9,
  border: "1.5px solid #e5e7eb",
  fontSize: 13,
  color: "#374151",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  ...FONT,
  transition: "border-color .15s",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#111827",
          marginBottom: 5,
          ...FONT,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ value, onChange }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, ...FONT }}>
        Choose the type of plan you want to create
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          {
            id: "recurring",
            icon: <RefreshCw size={26} color="#374151" />,
            title: "Recurring",
            desc: "Members pay on a set schedule.",
          },
          {
            id: "one_time",
            icon: <Zap size={26} color="#374151" />,
            title: "One Time",
            desc: "A single payment for one purpose.",
          },
        ].map((opt) => {
          const sel = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                padding: "24px 18px",
                borderRadius: 12,
                cursor: "pointer",
                border: sel ? "2px solid #002FA7" : "1.5px solid #e5e7eb",
                background: sel ? "#f0f4ff" : "#fafafa",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                textAlign: "left",
                transition: "all .15s",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 11,
                  left: 11,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: sel ? "none" : "1.5px solid #d1d5db",
                  background: sel ? "#002FA7" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {sel && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <div style={{ marginTop: 14 }}>{opt.icon}</div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 3,
                    ...FONT,
                  }}
                >
                  {opt.title}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", ...FONT }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ form, onChange }) {
  const input = (label, key, type = "text", ph = "") => (
    <Field label={label}>
      <input
        type={type}
        value={form[key] || ""}
        placeholder={ph}
        onChange={(e) => onChange(key, e.target.value)}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
      />
    </Field>
  );

  const select = (label, key, opts, ph) => (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <select
          value={form[key] || ""}
          onChange={(e) => onChange(key, e.target.value)}
          style={{
            ...inputStyle,
            appearance: "none",
            cursor: "pointer",
            color: form[key] ? "#374151" : "#9ca3af",
          }}
        >
          <option value="" disabled>
            {ph}
          </option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          color="#9ca3af"
          style={{
            position: "absolute",
            right: 11,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </Field>
  );

  return (
    <div style={{ maxHeight: "58vh", overflowY: "auto", paddingRight: 4 }}>
      {input("Plan Name", "name", "text", "Enter plan name")}
      <Field label="Description">
        <textarea
          value={form.description || ""}
          placeholder="Briefly describe what this payment plan covers..."
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Amount Per Member">
          <input
            type="number"
            value={form.amount || ""}
            placeholder="₦0.00"
            onChange={(e) => onChange("amount", e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </Field>
        {select("Frequency", "frequency", FREQUENCIES, "Select frequency")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Start Date">
          <input
            type="date"
            value={form.startDate || ""}
            onChange={(e) => onChange("startDate", e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </Field>
        <Field label="Due Date">
          <input
            type="date"
            value={form.dueDate || ""}
            onChange={(e) => onChange("dueDate", e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </Field>
      </div>
      {select(
        "Applies To",
        "appliesTo",
        [
          "All Members (209)",
          "Specific Members",
          "Member Tier A",
          "Member Tier B",
        ],
        "All Members (209)",
      )}
      <p
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginTop: -10,
          marginBottom: 16,
          ...FONT,
        }}
      >
        You can adjust member assignment after the plan is created.
      </p>
      {select(
        "Set Auto Reminder",
        "reminder",
        REMINDERS,
        "Select reminder frequency",
      )}
      <p style={{ fontSize: 11, color: "#9ca3af", marginTop: -10, ...FONT }}>
        Reminders are sent via SMS and email to unpaid members.
      </p>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({ planType, form }) {
  const rows = [
    { label: "Plan Name", value: form.name || "—" },
    {
      label: "Plan Type",
      value: planType === "recurring" ? "Recurring" : "One Time",
    },
    {
      label: "Amount Per Member",
      value: form.amount ? `₦${Number(form.amount).toLocaleString()}` : "—",
    },
    { label: "Frequency", value: form.frequency || "—" },
    { label: "Due Date", value: form.dueDate || "—" },
    { label: "Applies To", value: form.appliesTo || "All Members" },
    { label: "Description", value: form.description || "—" },
  ];
  return (
    <div>
      <div
        style={{
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "12px 16px",
              background: i % 2 === 0 ? "#fafafa" : "#fff",
              borderBottom: i < rows.length - 1 ? "1px solid #f3f4f8" : "none",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#6b7280",
                flex: "0 0 140px",
                ...FONT,
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
                textAlign: "right",
                flex: 1,
                ...FONT,
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: "13px 15px",
          borderRadius: 10,
          background: "#f0f4ff",
          border: "1px solid #c7d2fe",
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.6,
          ...FONT,
        }}
      >
        Once created, assigned members will receive a notification. You can edit
        or pause this plan at any time.
      </div>
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────
function SuccessState({ onClose }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 20px" }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#ecfdf5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
        }}
      >
        <Check size={26} color="#059669" strokeWidth={2.5} />
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: "#0f1d6e",
          marginBottom: 8,
          ...FONT,
        }}
      >
        Plan Created Successfully!
      </h3>
      <p
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginBottom: 26,
          lineHeight: 1.6,
          ...FONT,
        }}
      >
        Members assigned to this plan have been notified. Manage it from the
        Payments page.
      </p>
      <button
        onClick={onClose}
        style={{
          padding: "11px 32px",
          borderRadius: 99,
          border: "none",
          background: "#002FA7",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          ...FONT,
        }}
      >
        Done
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function CreatePaymentPlanModal({ onClose }) {
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
    appliesTo: "",
    reminder: "",
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canContinue =
    step === 1
      ? !!planType
      : step === 2
        ? !!(form.name && form.amount && form.frequency)
        : true;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15,29,110,0.2)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 660,
          boxShadow: "0 20px 60px rgba(15,29,110,0.16)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          animation: "modalIn .2s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 26px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#0f1d6e",
                margin: 0,
                ...FONT,
              }}
            >
              Create Payment Plan
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: "4px 0 0",
                ...FONT,
              }}
            >
              You can edit or pause any plan at any time.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px 26px",
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {success ? (
            <SuccessState onClose={onClose} />
          ) : (
            <>
              <StepIndicator current={step} />
              <div style={{ flex: 1, overflow: "auto" }}>
                {step === 1 && (
                  <Step1 value={planType} onChange={setPlanType} />
                )}
                {step === 2 && <Step2 form={form} onChange={update} />}
                {step === 3 && <Step3 planType={planType} form={form} />}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div
            style={{
              padding: "14px 26px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #f3f4f8",
            }}
          >
            <button
              onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "9px 18px",
                borderRadius: 99,
                border: "none",
                background: "transparent",
                color: "#002FA7",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                ...FONT,
              }}
            >
              <ArrowLeft size={13} /> Back
            </button>
            <button
              onClick={() =>
                step < 3 ? setStep((s) => s + 1) : setSuccess(true)
              }
              disabled={!canContinue}
              style={{
                padding: "10px 44px",
                borderRadius: 99,
                border: "none",
                background: canContinue ? "#002FA7" : "#e5e7eb",
                color: canContinue ? "#fff" : "#9ca3af",
                fontSize: 13,
                fontWeight: 700,
                cursor: canContinue ? "pointer" : "not-allowed",
                transition: "all .15s",
                ...FONT,
              }}
            >
              {step === 3 ? "Create Plan" : "Continue"}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─── PaymentsPage ─────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = PAYMENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.plan.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F7F8FC",
        ...FONT,
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar searchPlaceholder="Search payments, plans, members..." />

        <main style={{ flex: 1, padding: "24px 24px 48px", overflowY: "auto" }}>
          {/* Page header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 22,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f1d6e",
                  margin: 0,
                  ...FONT,
                }}
              >
                Payments
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  margin: "4px 0 0",
                  ...FONT,
                }}
              >
                Manage payment plans and track member contributions.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: "#002FA7",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                ...FONT,
              }}
            >
              <Plus size={14} /> Create Payment Plan
            </button>
          </div>

          {/* Payment Plans table */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #eef0f8",
              boxShadow: "0 1px 4px rgba(0,47,167,0.05)",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                padding: "16px 20px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f1d6e",
                  ...FONT,
                }}
              >
                Payment Plans
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#6b7280",
                  background: "#f5f6fa",
                  borderRadius: 99,
                  padding: "3px 10px",
                  ...FONT,
                }}
              >
                {PLANS.length} plans
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderTop: "1px solid #eef0f8",
                      borderBottom: "1px solid #eef0f8",
                    }}
                  >
                    {[
                      "Plan Name",
                      "Type",
                      "Progress",
                      "Collected",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 20px",
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                          ...FONT,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((plan, i) => {
                    const ps = PLAN_STATUS_STYLE[plan.status];
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #f3f4f8" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafbff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "13px 20px" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f1d6e",
                              ...FONT,
                            }}
                          >
                            {plan.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                              marginTop: 2,
                              ...FONT,
                            }}
                          >
                            {plan.members} members paid
                          </div>
                        </td>
                        <td style={{ padding: "13px 20px" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: plan.fColor,
                              background: plan.fBg,
                              borderRadius: 99,
                              padding: "3px 9px",
                              ...FONT,
                            }}
                          >
                            {plan.freq}
                          </span>
                        </td>
                        <td style={{ padding: "13px 20px", minWidth: 140 }}>
                          <div
                            style={{
                              height: 5,
                              borderRadius: 99,
                              background: "#eef0f8",
                              overflow: "hidden",
                              marginBottom: 4,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${plan.pct}%`,
                                background: plan.bar,
                                borderRadius: 99,
                              }}
                            />
                          </div>
                          <div
                            style={{ fontSize: 11, color: "#9ca3af", ...FONT }}
                          >
                            {plan.pct}% collected
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "13px 20px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f1d6e",
                            ...FONT,
                          }}
                        >
                          {plan.amount}
                        </td>
                        <td style={{ padding: "13px 20px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: ps.color,
                              background: ps.bg,
                              borderRadius: 99,
                              padding: "3px 10px",
                              ...FONT,
                            }}
                          >
                            {plan.status}
                          </span>
                        </td>
                        <td style={{ padding: "13px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <button
                              style={{
                                padding: "5px 12px",
                                borderRadius: 6,
                                border: "1px solid #e0e3f0",
                                background: "#fff",
                                color: "#374151",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                ...FONT,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: "1px solid #e0e3f0",
                                background: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#6b7280",
                              }}
                            >
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

          {/* Member Payments table */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #eef0f8",
              boxShadow: "0 1px 4px rgba(0,47,167,0.05)",
            }}
          >
            <div
              style={{
                padding: "16px 20px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f1d6e",
                  ...FONT,
                }}
              >
                Member Payments
              </span>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: "1.5px solid #e0e3f0",
                  background: "#fff",
                  color: "#374151",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  ...FONT,
                }}
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f5f6fa",
                  borderRadius: 8,
                  padding: "7px 12px",
                  border: "1px solid #eef0f8",
                  width: 280,
                }}
              >
                <Search size={12} color="#9ca3af" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members, payments..."
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 12,
                    color: "#374151",
                    ...FONT,
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280", ...FONT }}>
                  Sort by:
                </span>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 11px",
                    borderRadius: 6,
                    border: "1px solid #e0e3f0",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer",
                    ...FONT,
                  }}
                >
                  Recent <ChevronDown size={11} />
                </button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderTop: "1px solid #eef0f8",
                      borderBottom: "1px solid #eef0f8",
                    }}
                  >
                    {[
                      "Members",
                      "Plan",
                      "Amount",
                      "Date",
                      "Email",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 20px",
                          textAlign: "left",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                          ...FONT,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const s = STATUS_STYLE[row.status];
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #f3f4f8" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafbff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#002FA7",
                              cursor: "pointer",
                              ...FONT,
                            }}
                          >
                            {row.name}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: row.dot,
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                color: "#374151",
                                ...FONT,
                              }}
                            >
                              {row.plan}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            fontSize: 13,
                            color: "#374151",
                            ...FONT,
                          }}
                        >
                          {row.amount}
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            fontSize: 13,
                            color: "#374151",
                            ...FONT,
                          }}
                        >
                          {row.date}
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            fontSize: 13,
                            color: "#374151",
                            ...FONT,
                          }}
                        >
                          {row.email}
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: s.color,
                              background: s.bg,
                              borderRadius: 99,
                              padding: "3px 10px",
                              ...FONT,
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <button
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: "1px solid #e0e3f0",
                                background: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#6b7280",
                              }}
                            >
                              <RotateCcw size={12} />
                            </button>
                            <button
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: "1px solid #e0e3f0",
                                background: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#6b7280",
                              }}
                            >
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

      {modalOpen && (
        <CreatePaymentPlanModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
