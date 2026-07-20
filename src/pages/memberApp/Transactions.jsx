import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
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
    Success: "bg-success-tint text-[#15803d]",
    Failed: "bg-[#fce4e4] text-danger",
    Pending: "bg-[#fef9c3] text-[#b45309]",
  };
  const label = statusLabel(status);
  const cls = map[label] ?? map.Pending;
  return (
    <span className={`inline-block text-xs font-semibold rounded-md py-0.5 px-2.5 ${cls}`}>
      {label}
    </span>
  );
}

// ─── Simple dropdown ──────────────────────────────────────────────────────────
function Dropdown({ value, options, onChange, optionLabel = (opt) => opt }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="border border-surface-container-border flex items-center gap-1.5 bg-white rounded-lg py-[7px] px-3.5 text-sm font-medium text-[#111827] cursor-pointer"
      >
        {optionLabel(value)}
        <ChevronDown size={14} color="#6b7280" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="border border-surface-container-border absolute left-0 bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.1)] z-20 min-w-[140px] overflow-hidden [top:calc(100%+6px)]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full text-left py-2.5 px-4 text-sm border-none cursor-pointer ${opt === value ? "text-[#2563eb] font-semibold bg-[#eff6ff]" : "text-[#111827] font-normal bg-transparent"}`}
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
function TxRow({ tx, onOpen }) {
  return (
    <div
      onClick={() => onOpen(tx)}
      className="flex items-center justify-between gap-2 py-3.5 px-5 border-b border-stacked-container cursor-pointer"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-[#111827] m-0">
          {toTitleCase(tx.description)}
        </p>
        <p className="text-[13px] text-[#9ca3af] mt-0.5 mx-0 mb-0">
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
      <div className="text-right flex-shrink-0">
        <p className="text-[15px] font-semibold text-[#111827] mt-0 mx-0 mb-1">
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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const { data: transactions = [], isLoading, error, refetch } = useTransactions();

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
      className="relative overflow-hidden min-h-screen max-w-[430px] mx-auto pb-10"
      style={{ fontFamily: "Inter, -apple-system, sans-serif" }}
    >
      <GlassLogoGlow />
      {/* ── Top bar ── */}
      <div className="pt-6 px-5 pb-4 flex items-center gap-3 sticky top-0 z-40">
        <button
          onClick={() => navigate(-1)}
          className="border border-surface-container-border w-9 h-9 rounded-full bg-white flex items-center justify-center cursor-pointer flex-shrink-0"
        >
          <ChevronLeft size={18} color="#374151" />
        </button>
        <h1 className="text-lg font-medium text-[#111827] m-0 flex-1 text-center mr-9">
          Payment History
        </h1>
      </div>

      {/* ── Status + month filters ── */}
      <div className="pt-0 px-5 pb-3.5 flex gap-2">
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
        <div className="text-center py-8">
          <p className="text-danger text-sm mb-3">
            Couldn't load transactions.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-transparent border border-[#FCA5A5] rounded-full text-[#EF4444] text-xs font-semibold cursor-pointer py-1.5 px-4.5"
          >
            Try again
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="mx-3 py-12 px-6 text-center flex flex-col items-center gap-2">
          <div className="w-[52px] h-[52px] rounded-full bg-stacked-container flex items-center justify-center mb-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#374151] m-0">No transactions yet</p>
          <p className="text-[13px] text-[#9CA3AF] m-0">Your payment history will appear here.</p>
        </div>
      ) : (
        groups.map(([label, txs]) => (
          <div
            key={label}
            className="bg-surface-container rounded-2xl mx-3 mt-0 mb-3 overflow-hidden"
          >
            <div className="py-3 px-5 flex items-center gap-1.5 border-b border-stacked-container">
              <span className="text-sm font-bold text-[#2563eb]">
                {label}
              </span>
            </div>
            {txs.map((tx) => (
              <TxRow
                key={tx.id}
                tx={tx}
                onOpen={(t) => navigate(`/member/transactions/${t.id}`)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
