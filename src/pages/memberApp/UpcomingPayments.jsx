import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { usePayments } from "../../hooks/usePayments";
import PageLoadingState from "../../components/common/PageLoadingState";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import { formatNaira, formatDate, toTitleCase } from "../../utils/format";

const FILTER_OPTIONS = ["All", "Recurring", "One-time"];

function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg border-[1.5px] border-[#CCC] bg-white text-[#111] text-[13px] font-semibold cursor-pointer"
      >
        {value}
        <ChevronDown size={14} strokeWidth={2} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-outline-on-surface z-20 overflow-hidden min-w-[130px] [top:calc(100%+6px)]">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`block w-full text-left py-[11px] px-4 text-[13px] cursor-pointer border-none ${value === opt ? "bg-[#F0F2FA] text-brand font-semibold" : "bg-white text-[#333] font-normal"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PaymentRow({ item, onPay, paying }) {
  const isRecurring = item.type === "recurring";
  const badge = isRecurring
    ? { label: "Recurring", cls: "text-[#7C3AED]", dotCls: "bg-[#7C3AED]" }
    : { label: "One-time", cls: "text-[#DC2626]", dotCls: "bg-[#DC2626]" };

  return (
    <div className="border border-surface-container-border py-[18px] px-4 bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-xl font-bold text-[#111]">
            {formatNaira(item.amount)}
          </span>
          {isRecurring && (
            <span className="text-[13px] text-[#888]">/month</span>
          )}
          <span className={`inline-flex items-center gap-[5px] text-xs font-semibold ml-1 ${badge.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dotCls}`} />
            {badge.label}
          </span>
        </div>
        <p className="text-[15px] text-[#111] mt-0 mx-0 mb-[3px] font-medium">
          {toTitleCase(item.name)}
        </p>
        <p className="text-[13px] text-[#9CA3AF] m-0">
          Due: {formatDate(item.dueDate)}
        </p>
      </div>
      <button
        onClick={() => onPay(item)}
        disabled={paying}
        className={`flex-shrink-0 py-[9px] px-[18px] rounded-lg border-[1.5px] border-brand bg-white text-brand text-[13px] font-semibold cursor-pointer ${paying ? "opacity-60" : "opacity-100"}`}
      >
        {paying ? "Starting…" : "Pay Now"}
      </button>
    </div>
  );
}

export default function UpcomingPayments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const { data, isLoading, error: loadError, refresh } = usePayments();

  const upcoming = data?.upcoming ?? [];
  const filtered = upcoming.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Recurring") return item.type === "recurring";
    return item.type === "one-time";
  });

  function handlePay(item) {
    const suffix = item._isLink ? "?via=link" : "";
    // See Home.jsx's handlePay -- PaymentSummary's own fetch may not carry
    // community info back, so pass along what we already have as a fallback.
    navigate(`/member/pay/${item.id}${suffix}`, {
      state: { communityName: item.communityName, communityLogo: item.logo },
    });
  }

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <GlassLogoGlow />
      {/* Header */}
      <div className="relative flex items-center justify-center pt-6 px-5 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-medium text-[#111] m-0">
          Upcoming Payments
        </h1>
      </div>

      {/* Filter */}
      <div className="pt-0 px-4 pb-4">
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {/* List */}
      <div className="mx-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="border border-surface-container-border bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            <PageLoadingState label="Loading your payments…" size={56} padding="36px 24px" />
          </div>
        ) : loadError ? (
          <div className="border border-surface-container-border bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.06)] text-center py-5">
            <p className="text-[#DC2626] text-sm mt-0 mx-0 mb-2">
              Couldn't load upcoming payments.
            </p>
            <button
              onClick={refresh}
              className="bg-transparent border-none text-brand text-[13px] font-semibold underline cursor-pointer p-0"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-surface-container-border bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.06)] py-12 px-6 text-center flex flex-col items-center gap-2">
            <div className="w-[52px] h-[52px] rounded-full bg-[#D7E2FF] flex items-center justify-center mb-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-9"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#374151] m-0">Nothing due right now</p>
            <p className="text-[13px] text-[#9CA3AF] m-0">You're up to date on all payments.</p>
            <button
              onClick={refresh}
              className="mt-1 bg-transparent border-none text-brand text-[13px] font-semibold cursor-pointer p-0"
            >
              Check again
            </button>
          </div>
        ) : (
          filtered.map((item) => (
            <PaymentRow key={item.id} item={item} onPay={handlePay} />
          ))
        )}
      </div>
    </div>
  );
}
