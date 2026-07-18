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
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1.5px solid #CCC",
          background: "#fff",
          color: "#111",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {value}
        <ChevronDown size={14} strokeWidth={2} />
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
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              border: "1px solid var(--color-outline-on-surface)",
              zIndex: 20,
              overflow: "hidden",
              minWidth: 130,
            }}
          >
            {FILTER_OPTIONS.map((opt) => (
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
                  padding: "11px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: value === opt ? "#F0F2FA" : "#fff",
                  color: value === opt ? "#002FA7" : "#333",
                  fontWeight: value === opt ? 600 : 400,
                  border: "none",
                }}
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
    ? { label: "Recurring", color: "#7C3AED", bg: "#F3E8FF" }
    : { label: "One-time", color: "#DC2626", bg: "#FEE2E2" };

  return (
    <div
      className="border border-surface-container-border"
      style={{
        padding: "18px 16px",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
            {formatNaira(item.amount)}
          </span>
          {isRecurring && (
            <span style={{ fontSize: 13, color: "#888" }}>/month</span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: badge.color,
              marginLeft: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: badge.color,
                flexShrink: 0,
              }}
            />
            {badge.label}
          </span>
        </div>
        <p style={{ fontSize: 15, color: "#111", margin: "0 0 3px", fontWeight: 500 }}>
          {toTitleCase(item.name)}
        </p>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
          Due: {formatDate(item.dueDate)}
        </p>
      </div>
      <button
        onClick={() => onPay(item)}
        disabled={paying}
        style={{
          flexShrink: 0,
          padding: "9px 18px",
          borderRadius: 8,
          border: "1.5px solid #002FA7",
          background: "#fff",
          color: "#002FA7",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          opacity: paying ? 0.6 : 1,
        }}
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
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
         
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
      }}
    >
      <GlassLogoGlow />
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 20px",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>
          Upcoming Payments
        </h1>
      </div>

      {/* Filter */}
      <div style={{ padding: "0 16px 16px" }}>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {/* List */}
      <div
        style={{
          margin: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {isLoading ? (
          <div className="border border-surface-container-border" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <PageLoadingState label="Loading your payments…" size={56} padding="36px 24px" />
          </div>
        ) : loadError ? (
          <div className="border border-surface-container-border" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#DC2626", fontSize: 14, margin: "0 0 8px" }}>
              Couldn't load upcoming payments.
            </p>
            <button
              onClick={refresh}
              style={{ background: "none", border: "none", color: "#002FA7", fontSize: 13, fontWeight: 600, textDecoration: "underline", cursor: "pointer", padding: 0 }}
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-surface-container-border" style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#D7E2FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-9"/>
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>Nothing due right now</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>You're up to date on all payments.</p>
            <button
              onClick={refresh}
              style={{ marginTop: 4, background: "none", border: "none", color: "#002FA7", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
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
