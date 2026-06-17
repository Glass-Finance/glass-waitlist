import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  ChevronDown,
  Clock,
  Home as HomeIcon,
  CreditCard,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — matches Figma exactly
// ---------------------------------------------------------------------------
const MOCK_USER = { firstName: "David" };
const MOCK_COMMUNITY = { name: "Kings College Community" };

const MOCK_NEXT_DUE = {
  id: "1",
  type: "recurring",
  amount: 15000,
  description: "Alumni Contribution",
  dueDate: "2025-06-01",
};

const MOCK_UPCOMING = [
  {
    id: "2",
    amount: 2500,
    type: "recurring",
    description: "Infrastructure Development",
    dueDate: "2025-06-15",
  },
  {
    id: "3",
    amount: 8500,
    type: "one-time",
    description: "School Fees Support",
    dueDate: "2025-06-15",
  },
];

const MOCK_HISTORY = [
  {
    id: "h1",
    description: "Membership",
    date: "2026-05-01",
    amount: 24000,
    status: "success",
  },
  {
    id: "h2",
    description: "Membership",
    date: "2026-05-01",
    amount: 24000,
    status: "failed",
  },
  {
    id: "h3",
    description: "Membership",
    date: "2026-05-01",
    amount: 24000,
    status: "success",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("NGN", "₦");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateString) {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Side drawer
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { Icon: HomeIcon, label: "Home", to: "/member/home" },
  { Icon: CreditCard, label: "Manage Payments", to: "/member/manage-payments" },
  { Icon: User, label: "Profile", to: "/member/profile" },
  { Icon: Settings, label: "Settings", to: "/member/settings" },
];

function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.25)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          zIndex: 50,
          background: "#D9D9D9",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div>
              <img
                src="/Glass.png"
                alt="Glass"
                style={{ width: 30, height: 30 }}
              />
            </div>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#111" }}>
              Glass
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#555",
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div style={{ height: 1, background: "#0000000D", margin: "0 ", }} />

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "8px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map(({ Icon, label, to }) => (
            <button
              key={label}
              onClick={() => {
                onClose();
                navigate(to);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 12px",
                borderRadius: 12,
                border: "none",
                background: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <Icon size={20} strokeWidth={1.6} style={{ color: "#444" }} />
              <span style={{ fontSize: 15, fontWeight: 400, color: "#222" }}>
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* Log out — pinned to bottom */}
        <button
          onClick={() => {
            onClose(); /* logout logic here */
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 24px",
            paddingBottom: "env(safe-area-inset-bottom, 32px)",
            border: "none",
            background: "none",
            cursor: "pointer",
            textAlign: "left",
            outline: "none",
          }}
        >
          <LogOut size={18} strokeWidth={1.8} style={{ color: "#D32F2F" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#D32F2F" }}>
            Log Out
          </span>
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------
function HeroCard({ onPay }) {
  const p = MOCK_NEXT_DUE;

  return (
    <div
      style={{
        margin: "0 16px",
        borderRadius: 16,
        background: "#002FA7",
        padding: "20px 20px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      {/* Recurring pill */}
      <div
        style={{
          marginBottom: 14,
          padding: "5px 18px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.45)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Recurring
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 6,
          fontWeight: 400,
        }}
      >
        Next Payment Due
      </p>

      {/* Amount */}
      <p
        style={{
          fontSize: 42,
          fontWeight: 400,
          color: "#fff",
          letterSpacing: "-1px",
          lineHeight: 1,
          marginBottom: 14,
        }}
      >
        ₦15,000
      </p>

      {/* Plan name badge */}
      <div
        style={{
          padding: "6px 16px",
          borderRadius: 8,
          background: "#D7E2FF",
          color: "#002FA7",
          fontSize: 12,
          fontWeight: 400,
          marginBottom: 10,
        }}
      >
        Alumni Contribution
      </div>

      {/* Due date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 18,
          color: "rgba(255,255,255,0.55)",
          fontSize: 12,
        }}
      >
        <Clock size={12} strokeWidth={1.8} />
        <span>Due June 1, 2025</span>
      </div>

      {/* Pay Now button */}
      <button
        onClick={() => onPay(p)}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 4,
          border: "none",
          background: "#fff",
          color: "#000000",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Pay Now
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming row
// ---------------------------------------------------------------------------
function UpcomingRow({ payment, onPay }) {
  const isRecurring = payment.type === "recurring";

  const badge = isRecurring
    ? { label: "Recurring", color: "#1C2B8A", bg: "#E8ECF8" }
    : { label: "One-time", color: "#9C27B0", bg: "#F3E5F5" };

  return (
    <div
      style={{
        padding: "14px 12px",
        margin: "16px 0",
        borderRadius: 8,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {/* Left — all text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 2,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>
            {formatNaira(payment.amount)}
          </span>
          {isRecurring && (
            <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>
              /month
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#333",
            fontWeight: 400,
            marginBottom: 4,
          }}
        >
          {payment.description}
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
            Due: {formatDateShort(payment.dueDate)}
          </span>
        </div>
      </div>

      {/* Right — badge above Pay Now */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: badge.color,
            background: badge.bg,
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {badge.label}
        </span>
        <button
          onClick={() => onPay(payment)}
          style={{
            padding: "7px 16px",
            borderRadius: 4,
            border: "1.5px solid #002FA7",
            background: "#fff",
            color: "#002FA7",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History row
// ---------------------------------------------------------------------------
function HistoryRow({ item }) {
  const isSuccess = item.status === "success";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 0",
        borderBottom: "1px solid #F0F0F0",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#111",
            marginBottom: 3,
          }}
        >
          {item.description}
        </p>
        <p style={{ fontSize: 12, color: "#999" }}>
          {new Date(item.date)
            .toLocaleDateString("en-NG", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
            .replace(",", ",")}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
          {formatNaira(item.amount)}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isSuccess ? "#059669" : "#DC2626",
            background: isSuccess ? "#ECFDF5" : "#FEF2F2",
            padding: "2px 10px",
            borderRadius: 999,
          }}
        >
          {isSuccess ? "Success" : "Failed"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home — root export
// ---------------------------------------------------------------------------
export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handlePay(payment) {
    // navigate(`/member/pay/${payment.id}`);
    console.log("pay", payment);
  }

  return (
    <>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div
        style={{
          minHeight: "100vh",
          background: "#EBEBEB",
          fontFamily: "'Inter', system-ui, sans-serif",
          paddingBottom: 40,
        }}
      >
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 16px 16px",
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: "#222",
                borderRadius: 2,
              }}
            />
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: "#222",
                borderRadius: 2,
              }}
            />
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: "#222",
                borderRadius: 2,
              }}
            />
          </button>

          {/* Community pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {/* Favicon placeholder — replace with actual community logo */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#1C2B8A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              K
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
              Kings College Community
            </span>
            <ChevronDown size={14} strokeWidth={2} style={{ color: "#666" }} />
          </div>

          {/* Bell */}
          <button
            aria-label="Notifications"
            onClick={() => navigate("/member/notifications")}
            style={{
              width: 38,
              height: 38,
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
            <Bell size={17} strokeWidth={1.8} style={{ color: "#333" }} />
          </button>
        </div>

        {/* ── Greeting ────────────────────────────────────────────────────── */}
        <div style={{ padding: "4px 20px 20px" }}>
          <h1
            style={{ fontSize: 24, fontWeight: 500, color: "#111", margin: 0 }}
          >
            Hi David,
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#888",
              marginTop: 3,
              fontWeight: 400,
            }}
          >
            Here's Your Community At A Glance
          </p>
        </div>

        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <HeroCard onPay={handlePay} />

        {/* ── Upcoming Payments ────────────────────────────────────────────── */}
        <div
          style={{
            margin: "16px 16px 0",
            background: "#EFEFF1E5",
            borderRadius: 16,
            padding: "16px 16px 4px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
              Upcoming Payments
            </span>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#1C2B8A",
                padding: 0,
              }}
            >
              Filter
              <ChevronDown size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* Rows */}
          {MOCK_UPCOMING.map((p) => (
            <UpcomingRow key={p.id} payment={p} onPay={handlePay} />
          ))}

          {/* View All */}
          <button
            onClick={() => navigate("/member/upcoming")}
            style={{
              display: "block",
              width: "100%",
              padding: "4px 0 10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#1C2B8A",
              textAlign: "center",
            }}
          >
            View All
          </button>
        </div>

        {/* ── Payment History ──────────────────────────────────────────────── */}
        <div
          style={{
            margin: "16px 16px 0",
            background: "#EFEFF1E5",
            borderRadius: 16,
            padding: "16px 16px 4px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
              Payment History
            </span>
            <button
              onClick={() => navigate("/member/transactions")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#002FA7",
                padding: 0,
              }}
            >
              See All
            </button>
          </div>

          {/* Rows */}
          {MOCK_HISTORY.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}
