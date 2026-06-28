import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Bell, ChevronDown, Clock } from "lucide-react";
import { usePayments } from "../../hooks/usePayments";
import SideDrawer from "../../components/memberApp/SideDrawer";

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
    .format(amount ?? 0)
    .replace("NGN", "₦");
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function firstName(user) {
  try {
    const ud =
      typeof user?.userData === "string"
        ? JSON.parse(user.userData)
        : user?.userData;
    if (ud?.firstName) return ud.firstName;
  } catch {
    /* ignore */
  }
  return user?.email?.split("@")[0] ?? "there";
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------
function HeroCard({ nextDue, onPay }) {
  if (!nextDue) {
    return (
      <div
        style={{
          margin: "0 16px",
          borderRadius: 16,
          background: "#002FA7",
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>
          You're all caught up — nothing due right now.
        </p>
      </div>
    );
  }

  const isRecurring = nextDue.type === "recurring";

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
        {isRecurring ? "Recurring" : "One-time"}
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
        {formatNaira(nextDue.amount)}
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
        {nextDue.name}
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
        <span>Due {formatDate(nextDue.dueDate)}</span>
      </div>

      {/* Pay Now button */}
      <button
        onClick={() => onPay(nextDue)}
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
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#333",
            fontWeight: 400,
            marginBottom: 4,
          }}
        >
          {payment.name}
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
          {formatDateShort(item.date)}
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
  const { data, isLoading } = usePayments();

  const nextDue = data?.nextDue ?? null;
  const upcoming = (data?.upcoming ?? [])
    .filter((o) => o.id !== nextDue?.id)
    .slice(0, 2);
  const history = (data?.history ?? []).slice(0, 3);
  const communityName = data?.community?.name ?? "Your Community";
  const communityInitial = communityName.charAt(0).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);

  function handlePay(payment) {
    navigate(`/member/pay/${payment.id}`);
  }

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: "#EBEBEB",
          fontFamily: "'Inter', system-ui, sans-serif",
          paddingBottom: 40,
        }}
      >
        <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* ── Top bar — menu, community pill, and notifications all on one
            row, the menu button is the persistent access point to
            Settings/My Communities since those have no other reachable
            path from this page. ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "25px 20px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              minWidth: 0,
            }}
          >
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center border-none cursor-pointer bg-transparent p-0"
              style={{ flexShrink: 0 }}
            >
              <Menu size={28} strokeWidth={2} style={{ color: "#222" }} />
            </button>

            {/* Community pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                minWidth: 0,
              }}
            >
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
                  flexShrink: 0,
                }}
              >
                {communityInitial}
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#111",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 120,
                }}
              >
                {communityName}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                style={{ color: "#666", flexShrink: 0 }}
              />
            </div>
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
              flexShrink: 0,
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
            Hi {firstName(data?.user)},
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

        {isLoading ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 13 }}>
            Loading…
          </p>
        ) : (
          <>
            {/* ── Hero card ───────────────────────────────────────────────────── */}
            <HeroCard nextDue={nextDue} onPay={handlePay} />

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
              </div>

              {upcoming.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#999",
                    padding: "12px 0 16px",
                  }}
                >
                  Nothing else due soon.
                </p>
              ) : (
                upcoming.map((p) => (
                  <UpcomingRow key={p.id} payment={p} onPay={handlePay} />
                ))
              )}

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

              {history.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#999",
                    padding: "12px 0 16px",
                  }}
                >
                  No payments yet.
                </p>
              ) : (
                history.map((item) => <HistoryRow key={item.id} item={item} />)
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
