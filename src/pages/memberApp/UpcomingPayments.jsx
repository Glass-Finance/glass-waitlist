import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Clock } from "lucide-react";
import { usePayments } from "../../hooks/usePayments";
import LoadingState from "../../components/common/LoadingState";
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
              border: "1px solid rgba(0,0,0,0.15)",
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
    ? { label: "Recurring", color: "#002FA7", bg: "#D7E2FF" }
    : { label: "One-time", color: "#6B2FB5", bg: "#E4D7F4" };

  return (
    <div
      style={{
        padding: "14px 16px",
        background: "#FFFFFF66",
        borderRadius: 12,
        border: "1px solid #EEEEEE",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: item.logoColor + "22",
            border: `1px solid ${item.logoColor}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: item.logoColor,
            overflow: "hidden",
          }}
        >
          {item.logo?.url ? (
            <img src={item.logo.url} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            item.logoText
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: badge.color,
            background: badge.bg,
            padding: "3px 12px",
            borderRadius: 999,
          }}
        >
          {badge.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 2,
          marginBottom: 2,
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>
          {formatNaira(item.amount)}
        </span>
        {isRecurring && (
          <span style={{ fontSize: 12, color: "#888" }}>/cycle</span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontSize: 13, color: "#333", marginBottom: 3 }}>
            {toTitleCase(item.name)}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#999",
            }}
          >
            <Clock size={11} strokeWidth={1.8} />
            <span style={{ fontSize: 12 }}>
              Due: {formatDate(item.dueDate)}
            </span>
          </div>
        </div>
        <button
          onClick={() => onPay(item)}
          disabled={paying}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1.5px solid #002FA7",
            background: "#fff",
            color: "#002FA7",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            opacity: paying ? 0.6 : 1,
          }}
        >
          {paying ? "Starting…" : "Pay Now"}
        </button>
      </div>
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
        minHeight: "100vh",
        background: "radial-gradient(ellipse 420px 340px at 15% 88%, rgba(124,58,237,0.10), transparent 70%), #F9F9FB",
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
      }}
    >
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
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>
          Upcoming Payments
        </h1>
      </div>

      {/* Filter */}
      <div style={{ padding: "0 16px 16px" }}>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {/* List card */}
      <div
        style={{
          margin: "0 16px",
          background: "#FFFFFF99",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {isLoading ? (
          <LoadingState className="py-5" />
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
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
          <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
