import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Clock } from "lucide-react";

const MOCK_UPCOMING = [
  {
    id: "1",
    amount: 2500,
    type: "recurring",
    name: "Annual Hackathon Fee",
    communityName: "Hacker Club",
    dueDate: "2025-06-15",
    logoColor: "#F5A623",
    logoText: "H",
  },
  {
    id: "2",
    amount: 8500,
    type: "one-time",
    name: "Rotary Club Of Lagos",
    communityName: "Rotary",
    dueDate: "2025-06-15",
    logoColor: "#1C2B8A",
    logoText: "R",
  },
  {
    id: "3",
    amount: 8500,
    type: "one-time",
    name: "Rotary Club Of Lagos",
    communityName: "Rotary",
    dueDate: "2025-06-15",
    logoColor: "#1C2B8A",
    logoText: "R",
  },
  {
    id: "4",
    amount: 8500,
    type: "one-time",
    name: "Rotary Club Of Lagos",
    communityName: "Rotary",
    dueDate: "2025-06-15",
    logoColor: "#1C2B8A",
    logoText: "R",
  },
  {
    id: "5",
    amount: 8500,
    type: "one-time",
    name: "Rotary Club Of Lagos",
    communityName: "Rotary",
    dueDate: "2025-06-15",
    logoColor: "#1C2B8A",
    logoText: "R",
  },
];

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace("NGN", "₦");
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PaymentRow({ item, onPay }) {
  const isRecurring = item.type === "recurring";
  const badge = isRecurring
    ? { label: "Recurring", color: "##002FA7", bg: "#D7E2FF" }
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
      {/* Top: logo + badge */}
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
          }}
        >
          {item.logoText}
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

      {/* Amount */}
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
          <span style={{ fontSize: 12, color: "#888" }}>/month</span>
        )}
      </div>

      {/* Name + Pay Now */}
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
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1.5px solid #002FA7",
            background: "#fff",
            color: "#002FA7",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}

export default function UpcomingPayments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  function handlePay(item) {
    console.log("Pay", item);
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
        <button
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
          {filter}
          <ChevronDown size={14} strokeWidth={2} />
        </button>
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
        {MOCK_UPCOMING.map((item, i) => (
          <PaymentRow key={item.id + i} item={item} onPay={handlePay} />
        ))}
      </div>
    </div>
  );
}
