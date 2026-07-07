import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Bell, ChevronDown, Clock } from "lucide-react";
import joinCommunityIcon from "../../assets/auth/join-community.webp";
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

function toTitleCase(str) {
  if (!str) return str;
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function firstName(user) {
  try {
    const ud =
      typeof user?.userData === "string"
        ? JSON.parse(user.userData)
        : user?.userData;
    if (ud?.firstName) return toTitleCase(ud.firstName);
  } catch {
    /* ignore */
  }
  return toTitleCase(user?.firstName ?? user?.email?.split("@")[0] ?? "there");
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------
function HeroCard({ nextDue, onPay, communityName, error, onRefresh }) {
  if (!nextDue) {
    const isError = Boolean(error);
    return (
      <div
        style={{
          margin: "0 16px",
          borderRadius: 20,
          background: isError ? "#FFF7F7" : "#EEF3FF",
          border: `1.5px solid ${isError ? "#FECACA" : "#C7D7FF"}`,
          padding: "32px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: isError ? "#FEE2E2" : "#D7E2FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 8,
        }}>
          {isError ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5 9-9" stroke="#002FA7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {communityName && communityName !== "Your Community" && (
          <p style={{ fontSize: 12, color: isError ? "#EF4444" : "#002FA7", margin: "0 0 2px", fontWeight: 500 }}>
            {communityName}
          </p>
        )}

        {isError ? (
          <>
            <p style={{ fontSize: 15, color: "#111", fontWeight: 700, margin: 0 }}>Couldn't load payments</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>Check your connection and try again.</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, color: "#111", fontWeight: 700, margin: 0 }}>You're all caught up</p>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>No payments due right now.</p>
          </>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              marginTop: 8,
              background: "none",
              border: `1px solid ${isError ? "#FCA5A5" : "#C7D7FF"}`,
              borderRadius: 20,
              color: isError ? "#EF4444" : "#002FA7",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: "6px 18px",
            }}
          >
            {isError ? "Try again" : "Check again"}
          </button>
        )}
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
  const isSuccess = item.status === "success" || item.status === "successful";
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
// ---------------------------------------------------------------------------
// Empty state — no community yet
// ---------------------------------------------------------------------------
function NoCommunityState({ navigate }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 32px 80px",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "#E4E4F0",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28, flexShrink: 0,
      }}>
        <img src={joinCommunityIcon} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
      </div>

      <p
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111",
          margin: "0 0 10px",
          lineHeight: 1.3,
        }}
      >
        You Are Not In Any<br />Community Yet
      </p>
      <p
        style={{
          fontSize: 14,
          color: "#888",
          margin: "0 0 36px",
          lineHeight: 1.6,
          maxWidth: 260,
        }}
      >
        Join a community to start tracking your dues and payments.
      </p>

      {/* Primary CTA */}
      <button
        onClick={() => navigate("/member/notifications")}
        style={{
          width: "100%",
          maxWidth: 300,
          padding: "16px 0",
          borderRadius: 10,
          border: "none",
          background: "#002FA7",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        Join A Community
      </button>

      {/* Secondary link */}
      <button
        onClick={() => navigate("/member/notifications")}
        style={{
          background: "none",
          border: "none",
          color: "#002FA7",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Check Your Invites
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { data, isLoading, error, refresh, hasNoCommunity } = usePayments();

  const nextDue = data?.nextDue ?? null;
  const upcoming = (data?.upcoming ?? [])
    .filter((o) => o.id !== nextDue?.id)
    .slice(0, 2);
  const history = (data?.history ?? []).slice(0, 3);
  const communityName = data?.community?.name ?? "Your Community";
  const communityInitial = communityName.charAt(0).toUpperCase();
  const communityLogo = data?.community?.logo;
  const [menuOpen, setMenuOpen] = useState(false);

  // Seed active community in localStorage the first time the member lands here
  useEffect(() => {
    if (!data?.community) return;
    try {
      if (!localStorage.getItem("glass_member_community")) {
        const { name, slug, id } = data.community;
        localStorage.setItem("glass_member_community", JSON.stringify({ name, slug, id }));
      }
    } catch { /* ignore */ }
  }, [data?.community]);

  function handlePay(payment) {
    const suffix = payment._isLink ? "?via=link" : "";
    // PaymentSummary re-fetches from a different endpoint (obligation detail,
    // or the standalone payment-link detail for the ?via=link case) that may
    // not carry community info back -- pass along what we already know here
    // as a fallback so the community name/logo don't regress on that screen.
    navigate(`/member/pay/${payment.id}${suffix}`, {
      state: { communityName: payment.communityName, communityLogo: payment.logo },
    });
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

            {/* Community pill — tapping navigates to communities list */}
            <button
              onClick={() => navigate("/member/communities")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                minWidth: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
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
                  overflow: "hidden",
                }}
              >
                {communityLogo?.url ? (
                  <img src={communityLogo.url} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  communityInitial
                )}
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
            </button>
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
        ) : hasNoCommunity ? (
          <NoCommunityState navigate={navigate} />
        ) : (
          <>
            {/* ── Hero card ───────────────────────────────────────────────────── */}
            <HeroCard nextDue={nextDue} onPay={handlePay} communityName={communityName} error={error} onRefresh={refresh} />

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
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "16px 0", color: "#C0C4CC" }}>
                  <Clock size={13} strokeWidth={1.8} />
                  <span style={{ fontSize: 13, color: "#BABEC7" }}>Nothing else due soon.</span>
                </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "16px 0", color: "#C0C4CC" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C0C4CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span style={{ fontSize: 13, color: "#BABEC7" }}>No payments yet.</span>
                </div>
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
