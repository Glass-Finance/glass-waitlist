import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import { useAuth } from "../../store/AuthContext";
import ReceiptDownloadButton from "../../components/common/ReceiptDownloadButton";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import PageLoadingState from "../../components/common/PageLoadingState";
import { formatNaira, toTitleCase } from "../../utils/format";

const STATUS_OPTIONS = ["All Status", "Success", "Failed", "Pending"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function monthLabel(dateStr) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

// Short form for the month-picker button ("May 2026" -> "May") — the year
// still disambiguates internally via the full label, just not shown here.
function monthShort(label) {
  return label.split(" ")[0];
}

function statusLabel(status) {
  if (status === "success" || status === "successful") return "Success";
  if (status === "failed") return "Failed";
  return "Pending";
}

function StatusBadge({ status }) {
  const map = {
    Success: { bg: "#dcfce7", color: "#15803d" },
    Failed: { bg: "#fce4e4", color: "#dc2626" },
    Pending: { bg: "#fef9c3", color: "#b45309" },
  };
  const label = statusLabel(status);
  const s = map[label] ?? map.Pending;
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
      {label}
    </span>
  );
}

// ─── Simple dropdown ──────────────────────────────────────────────────────────
function Dropdown({ value, options, onChange, optionLabel = (opt) => opt }) {
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
        {optionLabel(value)}
        <ChevronDown size={14} color="#6b7280" />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
              zIndex: 20,
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
                {optionLabel(opt)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx, payerName }) {
  const isSuccessful = statusLabel(tx.status) === "Success";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "14px 20px",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: "#111827", margin: 0 }}>
          {toTitleCase(tx.description)}
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "2px 0 0" }}>
          {tx.communityName}
          {tx.communityName ? " · " : ""}
          {tx.date
            ? new Date(tx.date).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>
            {formatNaira(tx.amount)}
          </p>
          <StatusBadge status={tx.status} />
        </div>
        <ReceiptDownloadButton
          tx={tx}
          payerName={payerName}
          disabled={!isSuccessful}
          iconSize={13}
          title={isSuccessful ? "Download receipt" : "Receipts are only available for successful payments"}
          buttonStyle={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: isSuccessful ? "pointer" : "not-allowed",
            color: isSuccessful ? "#374151" : "#d1d5db",
          }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const payerName = toTitleCase([user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const { data: transactions = [], isLoading, error } = useTransactions();

  // Month options come from the full (unfiltered-by-status) list, so
  // switching the status filter never changes which months are pickable —
  // only which of that month's rows are visible.
  const monthOptions = useMemo(() => {
    const seen = new Set();
    const months = [];
    for (const tx of transactions) {
      const key = monthLabel(tx.date);
      if (!seen.has(key)) {
        seen.add(key);
        months.push(key);
      }
    }
    return months; // already newest-first, transactions are pre-sorted
  }, [transactions]);

  // Default to the most recent month once data loads; re-anchor if the
  // current selection no longer exists (e.g. data refetched).
  useEffect(() => {
    if (monthOptions.length === 0) return;
    if (!selectedMonth || !monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  const filtered = transactions.filter(
    (tx) => statusFilter === "All Status" || statusLabel(tx.status) === statusFilter
  );

  // Group by month, then keep only the currently-selected month's group —
  // the month picker above the list switches which one that is.
  const groups = useMemo(() => {
    const map = new Map();
    for (const tx of filtered) {
      const key = monthLabel(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    }
    if (!selectedMonth) return Array.from(map.entries());
    return map.has(selectedMonth) ? [[selectedMonth, map.get(selectedMonth)]] : [];
  }, [filtered, selectedMonth]);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        background: "var(--color-surface-bg)",
        fontFamily: "Inter, -apple-system, sans-serif",
        maxWidth: 430,
        margin: "0 auto",
        paddingBottom: 40,
      }}
    >
      <GlassLogoGlow />
      {/* ── Top bar ── */}
      <div
        style={{
          background: "var(--color-surface-bg)",
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
          Payment History
        </h1>
      </div>

      {/* ── Status + month filters ── */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 8 }}>
        <Dropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
        {monthOptions.length > 0 && (
          <Dropdown
            value={selectedMonth}
            options={monthOptions}
            optionLabel={(m) => (m ? monthShort(m) : "")}
            onChange={setSelectedMonth}
          />
        )}
      </div>

      {isLoading ? (
        <PageLoadingState label="Loading your payment history…" size={56} padding="36px 24px" />
      ) : error ? (
        <p style={{ textAlign: "center", color: "#dc2626", fontSize: 14, padding: "32px 0" }}>
          Couldn't load transactions.
        </p>
      ) : groups.length === 0 ? (
        <div
          style={{
            margin: "0 12px",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-stacked-container)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>No transactions yet</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Your payment history will appear here.</p>
        </div>
      ) : (
        groups.map(([label, txs]) => (
          <div
            key={label}
            style={{
              background: "var(--color-surface-container)",
              borderRadius: 16,
              margin: "0 12px 12px",
              overflow: "hidden",
            }}
          >
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
                {label}
              </span>
            </div>
            {txs.map((tx) => (
              <TxRow key={tx.id} tx={tx} payerName={payerName} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
