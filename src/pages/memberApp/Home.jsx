import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Bell, ChevronDown, Clock } from "lucide-react";
import joinCommunityIcon from "../../assets/auth/join-community.webp";
import PageLoadingState from "../../components/common/PageLoadingState";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import { usePayments, usePendingPaymentVerification } from "../../hooks/usePayments";
import { useNotifications } from "../../hooks/useNotifications";
import SideDrawer from "../../components/memberApp/SideDrawer";
import {
  formatNaira,
  formatDateLong as formatDate,
  formatDate as formatDateShort,
  toTitleCase,
} from "../../utils/format";
import { frequencyAdverb } from "../../utils/recurring";

// ---------------------------------------------------------------------------
// Auto-Pay prompt — per the UI designer's spec, shown once on returning to
// Home right after paying a recurring plan for the first time (or any time
// auto-pay isn't already on for it). PaymentSuccess.jsx decides *whether* to
// hand this off (it already knows the plan/consent state); this only reads
// the one-shot flag and renders it. There's no API to flip auto-pay on
// instantly (see PaymentSuccess.jsx's comment) -- the backend only ever
// establishes it via a real payment with a fresh authorisation -- so "Yes"
// sends them into the real Auto-Pay settings flow instead of pretending a
// tap enabled it.
function AutoPayPrompt({ prompt, onDismiss, onEnable }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 80, display: "flex",
        alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div
        style={{
          width: "100%", maxWidth: 430, background: "#fff",
          borderRadius: "20px 20px 0 0", padding: "28px 24px",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        }}
      >
        <h2 style={{ fontSize: 19, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>
          Turn on Auto-Pay
        </h2>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.55, margin: "0 0 24px" }}>
          Would you like us to charge {formatNaira(prompt.amount)} automatically for{" "}
          <strong style={{ color: "#111" }}>{prompt.planName}</strong> {frequencyAdverb(prompt.frequency)}?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onDismiss}
            style={{
              padding: "11px 22px", borderRadius: 8, border: "1.5px solid #E5E7EB",
              background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            No
          </button>
          <button
            onClick={onEnable}
            style={{
              padding: "11px 26px", borderRadius: 8, border: "none",
              background: "var(--color-brand)", color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
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
          borderRadius: 16,
          background: isError ? "#FFF7F7" : "#002FA7",
          padding: "40px 24px 44px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Icon bubble */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: isError ? "#FEE2E2" : "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {isError ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="#EF4444"
                strokeWidth="1.8"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            /* Envelope icon */
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="2"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.8"
              />
              <path
                d="M2 7l10 7 10-7"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {isError ? (
          <>
            <p
              style={{
                fontSize: 18,
                color: "#111",
                fontWeight: 700,
                margin: "0 0 6px",
              }}
            >
              Couldn't load payments
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Check your connection and try again.
            </p>
            <button
              onClick={onRefresh}
              style={{
                marginTop: 16,
                background: "none",
                border: "1px solid #FCA5A5",
                borderRadius: 20,
                color: "#EF4444",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: "6px 18px",
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: 20,
                color: "#fff",
                fontWeight: 600,
                margin: "0 0 8px",
                letterSpacing: "-0.2px",
              }}
            >
              No Payments Due
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              New dues Will Appear Here
            </p>
          </>
        )}
      </div>
    );
  }

  const isRecurring = nextDue.type === "recurring";
  // Same "days < 0" rule usePayments.js's deriveStatus() uses for the
  // upcoming list, kept local here since that helper isn't exported --
  // this is the one place the card itself (not just a list row) needs to
  // know it, to decide the border color below.
  const isOverdue = new Date(nextDue.dueDate) < new Date();
  const accentColor = isOverdue ? "#DC2626" : "#002FA7";

  return (
    <div
      style={{
        margin: "0 16px",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        border: "1px solid #E0E0EB",
      }}
    >
      {/* Top block carries the accent border on 3 sides. Structural, not an
          absolutely-positioned overlay sized with height:50% — that relied
          on a percentage height resolving against this card's height, but
          the card is auto-height (sized by its own content), and a
          percentage height on an abs-positioned child of an auto-height
          container is undefined by spec. Browsers disagreed on how to
          resolve it, which is why the border intermittently rendered around
          the whole card instead of just the top. Two stacked, normally-
          flowing blocks can't have that ambiguity. */}
      <div
        style={{
          border: `1.5px solid ${accentColor}`,
          borderBottom: "none",
          borderRadius: "16px 16px 0 0",
          padding: "20px 20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Recurring pill */}
        <div
          style={{
            marginBottom: 14,
            padding: "5px 18px",
            borderRadius: 999,
            border: "1px solid #E0E0EB",
            color: "#374151",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isRecurring ? "#7C3AED" : "#DC2626",
              flexShrink: 0,
            }}
          />
          {isRecurring ? "Recurring" : "One-time"}
        </div>

        {/* Label */}
        <p
          style={{
            fontSize: 13,
            color: "#6B7280",
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
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-1px",
            lineHeight: 1,
            marginBottom: 14,
          }}
        >
          {formatNaira(nextDue.amount)}
        </p>
      </div>

      {/* Bottom block — no border */}
      <div
        style={{
          padding: "0 20px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
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
            color: isOverdue ? "#DC2626" : "#9CA3AF",
            fontSize: 12,
            fontWeight: isOverdue ? 600 : 400,
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
            background: accentColor,
            color: "#fff",
            fontSize: 15,
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
function HistoryRow({ item, onOpen }) {
  const isSuccess = item.status === "success" || item.status === "successful";
  return (
    <div
      onClick={() => onOpen(item)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 0",
        borderBottom: "1px solid #F0F0F0",
        cursor: "pointer",
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
// ---------------------------------------------------------------------------
// Loading state — mirrors NoCommunityState's layout (same icon-circle size,
// same centering/padding) so the page doesn't visibly jump once data
// resolves into the empty, pending, or loaded state.
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
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#E4E4F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          flexShrink: 0,
        }}
      >
        <img
          src={joinCommunityIcon}
          alt=""
          style={{ width: 44, height: 44, objectFit: "contain" }}
        />
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
        You Are Not In Any
        <br />
        Community Yet
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
        onClick={() => navigate("/member/communities/search")}
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

// ---------------------------------------------------------------------------
// Pending approval state — join request submitted, awaiting admin
// ---------------------------------------------------------------------------
function PendingApprovalState({ navigate, community }) {
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
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#FFF7E0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <Clock size={36} strokeWidth={1.6} style={{ color: "#D4A017" }} />
      </div>
      <p
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111",
          margin: "0 0 10px",
        }}
      >
        Request Pending
      </p>
      <p
        style={{
          fontSize: 14,
          color: "#888",
          margin: "0 0 8px",
          lineHeight: 1.6,
          maxWidth: 260,
        }}
      >
        Your request to join {community?.name ?? "this community"} is awaiting
        admin approval.
      </p>
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 36px" }}>
        You'll get access once it's approved.
      </p>
      <button
        onClick={() => navigate("/member/communities/search")}
        style={{
          background: "none",
          border: "1.5px solid #002FA7",
          borderRadius: 10,
          padding: "12px 24px",
          color: "#002FA7",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Browse Other Communities
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  // const { data, isLoading, error, refresh, hasNoCommunity } = usePayments();
  const {
    data,
    isLoading,
    error,
    refresh,
    hasNoCommunity,
    hasPendingCommunity,
    pendingCommunity,
  } = usePayments();
  // Catches payers who came back from Paystack without hitting the callback
  // page — verifies the stored pending reference so Paid shows immediately.
  usePendingPaymentVerification();
  // Unread count for the bell badge — without it members have no signal
  // that anything arrived unless they open the notifications page.
  const { unreadCount } = useNotifications();

  // Auto-Pay prompt handoff from PaymentSuccess.jsx's "Back to Home" --
  // read once on mount and consume immediately so a refresh/re-visit
  // doesn't reopen it.
  const [autoPayPrompt, setAutoPayPrompt] = useState(() => {
    try {
      const raw = sessionStorage.getItem("glass_autopay_prompt");
      if (!raw) return null;
      sessionStorage.removeItem("glass_autopay_prompt");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  function dismissAutoPayPrompt() {
    if (autoPayPrompt?.paymentLinkId) {
      try {
        localStorage.setItem(`glass_autopay_asked_${autoPayPrompt.paymentLinkId}`, "1");
      } catch { /* ignore */ }
    }
    setAutoPayPrompt(null);
  }

  function enableAutoPay() {
    dismissAutoPayPrompt();
    navigate("/member/auto-pay");
  }

  const nextDue = data?.nextDue ?? null;
  // Previously this excluded nextDue (upcoming[0], already shown in the
  // hero card above) and capped the rest at 2 -- so whenever there was
  // exactly one upcoming payment total, this list ended up empty while its
  // own count badge still said "1", which just looked broken (a number
  // with nothing under it). Simpler and more honest: show the top 3 of the
  // real list, full stop -- the soonest one being visible both here and
  // enlarged in the hero card above is a fine, common pattern, not a bug.
  const upcoming = (data?.upcoming ?? []).slice(0, 3);
  // The real total, uncapped -- upcoming.length above is deliberately
  // capped for card height, so it undercounts whenever there's more than
  // fits. This is what actually tells a member "there's more than what
  // you're looking at" before they tap into the full list.
  const totalUpcomingCount = (data?.upcoming ?? []).length;
  const hiddenUpcomingCount = totalUpcomingCount - upcoming.length;
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
        localStorage.setItem(
          "glass_member_community",
          JSON.stringify({ name, slug, id }),
        );
      }
    } catch {
      /* ignore */
    }
  }, [data?.community]);

  function handlePay(payment) {
    const suffix = payment._isLink ? "?via=link" : "";
    // PaymentSummary re-fetches from a different endpoint (obligation detail,
    // or the standalone payment-link detail for the ?via=link case) that may
    // not carry community info back -- pass along what we already know here
    // as a fallback so the community name/logo don't regress on that screen.
    navigate(`/member/pay/${payment.id}${suffix}`, {
      state: {
        communityName: payment.communityName,
        communityLogo: payment.logo,
      },
    });
  }

  return (
    <>
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
                  background: communityLogo?.url ? "transparent" : "#1C2B8A",
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
                  <img
                    src={communityLogo.url}
                    alt=""
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
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
              position: "relative",
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
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  minWidth: 15,
                  height: 15,
                  padding: "0 3px",
                  borderRadius: 999,
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid #fff",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
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
          <PageLoadingState label="Loading your community…" />
        ) : hasPendingCommunity ? (
          <PendingApprovalState
            navigate={navigate}
            community={pendingCommunity}
          />
        ) : hasNoCommunity ? (
          <NoCommunityState navigate={navigate} />
        ) : (
          <>
            {/* ── Hero card ───────────────────────────────────────────────────── */}
            <HeroCard
              nextDue={nextDue}
              onPay={handlePay}
              communityName={communityName}
              error={error}
              onRefresh={refresh}
            />

            {/* ── Upcoming Payments ────────────────────────────────────────────── */}
            <div
              style={{
                margin: "16px 16px 0",
                background: "var(--color-surface-container)",
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                    Upcoming Payments
                  </span>
                  {/* The true total -- not upcoming.length, which is capped
                      at 3 to keep the card short. Without this, someone
                      with more payments than fit on the card has no way to
                      tell more exist until they tap into the full list. */}
                  {totalUpcomingCount > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#1C2B8A",
                        background: "#E4E7F9",
                        borderRadius: 999,
                        padding: "1px 7px",
                        lineHeight: 1.5,
                      }}
                    >
                      {totalUpcomingCount}
                    </span>
                  )}
                </div>
              </div>

              {upcoming.length === 0 && totalUpcomingCount === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "28px 16px 20px",
                    textAlign: "center",
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: "#EBEBEB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="2"
                        y="5"
                        width="20"
                        height="14"
                        rx="2"
                        fill="#B0B4C0"
                      />
                      <path d="M2 10h20" stroke="#fff" strokeWidth="1.5" />
                      <rect
                        x="5"
                        y="14"
                        width="4"
                        height="2"
                        rx="0.5"
                        fill="#fff"
                      />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#111",
                      margin: "0 0 6px",
                    }}
                  >
                    No Upcoming Payments
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#9CA3AF",
                      margin: 0,
                      lineHeight: 1.55,
                      maxWidth: 220,
                    }}
                  >
                    New Dues from community will show up here once scheduled
                  </p>
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
                {hiddenUpcomingCount > 0
                  ? `View All — ${hiddenUpcomingCount} more`
                  : "View All"}
              </button>
            </div>

            {/* ── Payment History ──────────────────────────────────────────────── */}
            <div
              style={{
                margin: "16px 16px 0",
                background: "var(--color-surface-container)",
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "28px 16px 20px",
                    textAlign: "center",
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: "#EBEBEB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="4"
                        y="3"
                        width="16"
                        height="18"
                        rx="2"
                        fill="#B0B4C0"
                      />
                      <path
                        d="M8 8h8M8 12h8M8 16h5"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#111",
                      margin: "0 0 6px",
                    }}
                  >
                    No Payment History
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#9CA3AF",
                      margin: 0,
                      lineHeight: 1.55,
                      maxWidth: 230,
                    }}
                  >
                    Once you make your transaction history will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onOpen={(t) => navigate(`/member/transactions/${t.id}`)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {autoPayPrompt && (
        <AutoPayPrompt
          prompt={autoPayPrompt}
          onDismiss={dismissAutoPayPrompt}
          onEnable={enableAutoPay}
        />
      )}
    </>
  );
}
