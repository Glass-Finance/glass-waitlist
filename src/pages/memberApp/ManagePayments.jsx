import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";

// ─── Mock data — replace with real API hook ───────────────────────────────────
const MOCK_PAYMENTS = [
  {
    id: "1",
    type: "recurring",
    amount: 8500,
    name: "Annual Hackathon Fee",
    nextCharge: "Apr 1, 2025",
    autoPay: true,
    logo: null, // replace with actual image url/import
    card: { last4: "9718", expiry: "04/28", brand: "mastercard" },
  },
  {
    id: "2",
    type: "recurring",
    amount: 8500,
    name: "Annual Hackathon Fee",
    nextCharge: "Apr 1, 2025",
    autoPay: true,
    logo: null,
    card: { last4: "9718", expiry: "04/28", brand: "mastercard" },
  },
];

const FILTER_OPTIONS = ["All", "Recurring", "One-time"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace("NGN", "₦");
}

// ─── Mastercard SVG icon ──────────────────────────────────────────────────────
function MastercardIcon() {
  return (
    <svg
      width="32"
      height="20"
      viewBox="0 0 32 20"
      fill="none"
      aria-label="Mastercard"
    >
      <rect width="32" height="20" rx="3" fill="transparent" />
      <circle cx="12" cy="10" r="8" fill="#EB001B" />
      <circle cx="20" cy="10" r="8" fill="#F79E1B" />
      <path d="M16 4.27a8 8 0 0 1 0 11.46A8 8 0 0 1 16 4.27z" fill="#FF5F00" />
    </svg>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? "#1C2B8A" : "#D1D5DB",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s ease",
        }}
      />
    </button>
  );
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────
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
          border: "1.5px solid #D0D0D0",
          background: "#fff",
          color: "#111",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {value}
        <ChevronDown size={13} strokeWidth={2} />
      </button>
      {open && (
        <>
          {/* backdrop */}
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

// ─── Payment card ─────────────────────────────────────────────────────────────
function PaymentCard({ item, onToggleAutoPay, onChangeCard }) {
  const isRecurring = item.type === "recurring";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top section */}
      <div style={{ padding: "16px 16px 14px" }}>
        {/* Logo + badge row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          {/* Community logo */}
          {/* <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#F0F0F0",
              border: "1px solid #E0E0E0",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          > */}
            {item.logo ? (
              <img
                src={item.logo}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 20 }}>🎯</span>
            )}
          {/* </div> */}

          {/* Badge */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isRecurring ? "#002FA7" : "#7c3aed",
              background: isRecurring ? "#E8ECF8" : "#F3E8FF",
              padding: "4px 12px",
              borderRadius: 999,
            }}
          >
            {isRecurring ? "Recurring" : "One-time"}
          </span>
        </div>

        {/* Amount */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 3,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>
            {formatNaira(item.amount)}
          </span>
          {isRecurring && (
            <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}>
              /month
            </span>
          )}
        </div>

        {/* Name + Auto-Pay toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 3,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, color: "#000000" }}>
            {item.name}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, color: "#888" }}>Auto-Pay</span>
            <Toggle
              checked={item.autoPay}
              onChange={(val) => onToggleAutoPay(item.id, val)}
            />
          </div>
        </div>

        {/* Next charge */}
        {isRecurring && (
          <p style={{ fontSize: 12, color: "#999" }}>
            Next charge: {item.nextCharge}
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#F0F0F0" }} />

      {/* Card row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MastercardIcon />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
            ***{item.card.last4}{" "}
            <span style={{ color: "#999" }}>| {item.card.expiry}</span>
          </span>
        </div>
        <button
          onClick={() => onChangeCard(item.id)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#002FA7",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Change
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ManagePayments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [payments, setPayments] = useState(MOCK_PAYMENTS);

  function handleToggleAutoPay(id, val) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, autoPay: val } : p)),
    );
  }

  function handleChangeCard(id) {
    // navigate to card change flow
    console.log("Change card for payment", id);
  }

  const filtered = payments.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Recurring") return p.type === "recurring";
    if (filter === "One-time") return p.type === "one-time";
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EBEBEB",
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "22px 20px 20px",
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
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>
          Manage Payments
        </h1>
      </div>

      {/* Filter */}
      <div style={{ padding: "0 16px 16px" }}>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "0 16px",
        }}
      >
        {filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#999",
              fontSize: 14,
              marginTop: 40,
            }}
          >
            No payments found.
          </p>
        ) : (
          filtered.map((item) => (
            <PaymentCard
              key={item.id}
              item={item}
              onToggleAutoPay={handleToggleAutoPay}
              onChangeCard={handleChangeCard}
            />
          ))
        )}
      </div>
    </div>
  );
}
