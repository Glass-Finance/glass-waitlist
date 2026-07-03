import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Clock } from "lucide-react";
import { usePayments } from "../../hooks/usePayments";

const FILTER_OPTIONS = ["All", "Recurring", "One-time"];

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  })
    .format(amount ?? 0)
    .replace("NGN", "₦");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
              border: "1px solid #EFEFEF",
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
            <img src={item.logo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
            {item.name}
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
  const { data, isLoading, error: loadError } = usePayments();

  const upcoming = data?.upcoming ?? [];
  const filtered = upcoming.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Recurring") return item.type === "recurring";
    return item.type === "one-time";
  });

  function handlePay(item) {
    navigate(`/member/pay/${item.id}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EBEBEB",
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
          background: "#EFEFF1E5",
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
          <p style={{ textAlign: "center", color: "#999", fontSize: 14, padding: "20px 0" }}>
            Loading…
          </p>
        ) : loadError ? (
          <p style={{ textAlign: "center", color: "#DC2626", fontSize: 14, padding: "20px 0" }}>
            Couldn't load upcoming payments.
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 14, padding: "20px 0" }}>
            Nothing due right now.
          </p>
        ) : (
          filtered.map((item) => (
            <PaymentRow key={item.id} item={item} onPay={handlePay} />
          ))
        )}
      </div>
    </div>
  );
}
