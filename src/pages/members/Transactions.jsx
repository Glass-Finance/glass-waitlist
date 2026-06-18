import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
// Replace with real API call: useTransactions()
const MOCK_TRANSACTIONS = [
  {
    id: 1,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 2,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 3,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 4,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Failed",
  },
  {
    id: 5,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 6,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 7,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 8,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
  {
    id: 9,
    label: "Membership",
    date: "May 1, 2026",
    amount: 24000,
    status: "Success",
  },
];

const STATUS_OPTIONS = ["All Status", "Success", "Failed", "Pending"];
const MONTH_OPTIONS = ["May", "April", "March", "February", "January"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNaira(n) {
  return "N" + new Intl.NumberFormat("en-NG").format(n);
}

function StatusBadge({ status }) {
  const map = {
    Success: { bg: "#dcfce7", color: "#15803d" },
    Failed: { bg: "#fce4e4", color: "#dc2626" },
    Pending: { bg: "#fef9c3", color: "#b45309" },
  };
  const s = map[status] ?? map.Pending;
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 6,
        padding: "2px 10px",
      }}
    >
      {status}
    </span>
  );
}

// ─── Simple dropdown ──────────────────────────────────────────────────────────
function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "7px 14px",
          fontSize: 14,
          fontWeight: 500,
          color: "#111827",
          cursor: "pointer",
        }}
      >
        {value}
        <ChevronDown size={14} color="#6b7280" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            zIndex: 50,
            minWidth: 140,
            overflow: "hidden",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontSize: 14,
                color: opt === value ? "#2563eb" : "#111827",
                fontWeight: opt === value ? 600 : 400,
                background: opt === value ? "#eff6ff" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div>
        <p
          style={{ fontSize: 15, fontWeight: 500, color: "#111827", margin: 0 }}
        >
          {tx.label}
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "2px 0 0" }}>
          {tx.date}
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            margin: "0 0 4px",
          }}
        >
          {formatNaira(tx.amount)}
        </p>
        <StatusBadge status={tx.status} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Transactions() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [month, setMonth] = useState("May");

  const filtered = MOCK_TRANSACTIONS.filter(
    (tx) => statusFilter === "All Status" || tx.status === statusFilter,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "Inter, -apple-system, sans-serif",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          background: "#f3f4f6",
          padding: "24px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color="#374151" />
        </button>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "#111827",
            margin: 0,
            flex: 1,
            textAlign: "center",
            marginRight: 36,
          }}
        >
          Transactions
        </h1>
      </div>

      {/* ── Status filter ── */}
      <div style={{ padding: "0 20px 14px" }}>
        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
      </div>

      {/* ── Month group header ── */}
      <div
        style={{
          background: "#EFEFF1E5",
          borderRadius: 16,
          margin: "0 12px",
          overflow: "hidden",
        }}
      >
        {/* Month label — acts as a collapsible group header */}
        <div
          style={{
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>
            {month}
          </span>
          <ChevronDown size={14} color="#2563eb" />
        </div>

        {/* Transaction rows */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 20px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            No transactions found.
          </div>
        ) : (
          filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>

      {/* Bottom safe area */}
      <div style={{ height: 40 }} />
    </div>
  );
}
