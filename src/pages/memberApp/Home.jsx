import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Bell, ChevronDown, Clock } from "lucide-react";
import joinCommunityIcon from "../../assets/auth/join-community.webp";
import PageLoadingState from "../../components/common/PageLoadingState";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import AutoPayPrompt from "../../components/common/AutoPayPrompt";
import { usePayments, usePendingPaymentVerification } from "../../hooks/usePayments";
import { useNotifications } from "../../hooks/useNotifications";
import SideDrawer from "../../components/memberApp/SideDrawer";
import {
  formatNaira,
  formatDateLong as formatDate,
  formatDate as formatDateShort,
  toTitleCase,
} from "../../utils/format";

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
        className={`mx-4 rounded-2xl text-center flex flex-col items-center gap-0 px-6 pt-10 pb-11 ${isError ? "bg-[#FFF7F7]" : "bg-brand"}`}
      >
        {/* Icon bubble */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isError ? "bg-danger-tint" : "bg-white/15"}`}
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
            <p className="text-lg text-[#111] font-bold mb-1.5">
              Couldn't load payments
            </p>
            <p className="text-[13px] text-[#9CA3AF] m-0 leading-normal">
              Check your connection and try again.
            </p>
            <button
              onClick={onRefresh}
              className="mt-4 bg-transparent border border-[#FCA5A5] rounded-[20px] text-[#EF4444] text-xs font-semibold cursor-pointer py-1.5 px-[18px]"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p className="text-xl text-white font-semibold mb-2 tracking-[-0.2px]">
              No Payments Due
            </p>
            <p className="text-[13px] text-white/60 m-0 leading-normal">
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

  return (
    <div className="border border-surface-container-border mx-4 rounded-2xl overflow-hidden bg-white shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
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
        className={`border-t-[1.5px] border-x-[1.5px] rounded-t-2xl pt-5 px-5 flex flex-col items-center ${isOverdue ? "border-danger" : "border-brand"}`}
      >
        {/* Recurring pill */}
        <div className="border border-surface-container-border mb-3.5 py-1.5 px-[18px] rounded-full text-[#374151] text-xs font-medium flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRecurring ? "bg-[#7C3AED]" : "bg-danger"}`}
          />
          {isRecurring ? "Recurring" : "One-time"}
        </div>

        {/* Label */}
        <p className="text-[13px] text-[#6B7280] mb-1.5 font-normal">
          Next Payment Due
        </p>

        {/* Amount */}
        <p className="text-[42px] font-bold text-[#111827] tracking-[-1px] leading-none mb-3.5">
          {formatNaira(nextDue.amount)}
        </p>
      </div>

      {/* Bottom block — no border */}
      <div className="px-5 pb-5 flex flex-col items-center">
        {/* Plan name badge */}
        <div className="py-1.5 px-4 rounded-lg bg-[#D7E2FF] text-brand text-xs font-normal mb-2.5">
          {nextDue.name}
        </div>

        {/* Due date */}
        <div
          className={`flex items-center gap-[5px] mb-[18px] text-xs ${isOverdue ? "text-danger font-semibold" : "text-[#9CA3AF] font-normal"}`}
        >
          <Clock size={12} strokeWidth={1.8} />
          <span>Due {formatDate(nextDue.dueDate)}</span>
        </div>

        {/* Pay Now button */}
        <button
          onClick={() => onPay(nextDue)}
          className={`w-full py-3.5 rounded border-none text-white text-[15px] font-semibold cursor-pointer ${isOverdue ? "bg-danger" : "bg-brand"}`}
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
  const badgeLabel = isRecurring ? "Recurring" : "One-time";
  const badgeCls = isRecurring
    ? "text-[#1C2B8A] bg-[#E8ECF8]"
    : "text-[#9C27B0] bg-[#F3E5F5]";

  return (
    <div className="py-3.5 px-3 my-4 rounded-lg bg-white flex items-center justify-between gap-3">
      {/* Left — all text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-0.5 mb-1.5">
          <span className="text-[17px] font-bold text-[#111]">
            {formatNaira(payment.amount)}
          </span>
        </div>
        <p className="text-[13px] text-[#333] font-normal mb-1">
          {payment.name}
        </p>
        <div className="flex items-center gap-1 text-[#999]">
          <Clock size={11} strokeWidth={1.8} />
          <span className="text-xs">
            Due: {formatDateShort(payment.dueDate)}
          </span>
        </div>
      </div>

      {/* Right — badge above Pay Now */}
      <div className="flex flex-col items-end gap-4 flex-shrink-0">
        <span className={`text-[11px] font-semibold py-[3px] px-2.5 rounded-full ${badgeCls}`}>
          {badgeLabel}
        </span>
        <button
          onClick={() => onPay(payment)}
          className="py-[7px] px-4 rounded border-[1.5px] border-brand bg-white text-brand text-xs font-semibold cursor-pointer whitespace-nowrap"
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
      className="flex items-center justify-between py-[13px] border-b border-[#F0F0F0] cursor-pointer"
    >
      <div>
        <p className="text-sm font-medium text-[#111] mb-[3px]">
          {item.description}
        </p>
        <p className="text-xs text-[#999]">
          {formatDateShort(item.date)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-bold text-[#111]">
          {formatNaira(item.amount)}
        </span>
        <span
          className={`text-[11px] font-semibold py-0.5 px-2.5 rounded-full ${isSuccess ? "text-[#059669] bg-[#ECFDF5]" : "text-danger bg-[#FEF2F2]"}`}
        >
          {isSuccess ? "Success" : "Failed"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — no community yet
// ---------------------------------------------------------------------------
function NoCommunityState({ navigate }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 pt-[60px] pb-20 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[#E4E4F0] flex items-center justify-center mb-7 flex-shrink-0">
        <img
          src={joinCommunityIcon}
          alt=""
          className="w-11 h-11 object-contain"
        />
      </div>

      <p className="text-xl font-bold text-[#111] mb-2.5 leading-snug">
        You Are Not In Any
        <br />
        Community Yet
      </p>
      <p className="text-sm text-[#888] mb-9 leading-relaxed max-w-[260px]">
        Join a community to start tracking your dues and payments.
      </p>

      {/* Primary CTA */}
      <button
        onClick={() => navigate("/member/communities/search")}
        className="w-full max-w-[300px] py-4 rounded-[10px] border-none bg-brand text-white text-[15px] font-semibold cursor-pointer mb-4"
      >
        Join A Community
      </button>

      {/* Secondary link */}
      <button
        onClick={() => navigate("/member/notifications")}
        className="bg-transparent border-none text-brand text-sm font-semibold cursor-pointer"
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
    <div className="flex-1 flex flex-col items-center justify-center px-8 pt-[60px] pb-20 text-center">
      <div className="w-20 h-20 rounded-full bg-[#FFF7E0] flex items-center justify-center mb-7">
        <Clock size={36} strokeWidth={1.6} className="text-[#D4A017]" />
      </div>
      <p className="text-xl font-bold text-[#111] mb-2.5">
        Request Pending
      </p>
      <p className="text-sm text-[#888] mb-2 leading-relaxed max-w-[260px]">
        Your request to join {community?.name ?? "this community"} is awaiting
        admin approval.
      </p>
      <p className="text-[13px] text-[#aaa] mb-9">
        You'll get access once it's approved.
      </p>
      <button
        onClick={() => navigate("/member/communities/search")}
        className="bg-transparent border-[1.5px] border-brand rounded-[10px] py-3 px-6 text-brand font-semibold cursor-pointer"
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
        className="relative overflow-hidden min-h-screen pb-10"
      >
        <GlassLogoGlow />
        <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* ── Top bar — menu, community pill, and notifications all on one
            row, the menu button is the persistent access point to
            Settings/My Communities since those have no other reachable
            path from this page. ── */}
        <div className="flex items-center justify-between pt-[25px] px-5 pb-5">
          <div className="flex items-center gap-[15px] min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center border-none cursor-pointer bg-transparent p-0 flex-shrink-0"
            >
              <Menu size={28} strokeWidth={2} className="text-[#222]" />
            </button>

            {/* Community pill — tapping navigates to communities list */}
            <button
              onClick={() => navigate("/member/communities")}
              className="flex items-center gap-[7px] min-w-0 bg-transparent border-none cursor-pointer p-0"
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 overflow-hidden ${communityLogo?.url ? "bg-transparent" : "bg-[#1C2B8A]"}`}
              >
                {communityLogo?.url ? (
                  <img
                    src={communityLogo.url}
                    alt=""
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  communityInitial
                )}
              </div>
              <span className="text-sm font-medium text-[#111] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                {communityName}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className="text-[#666] flex-shrink-0"
              />
            </button>
          </div>

          {/* Bell */}
          <button
            aria-label="Notifications"
            onClick={() => navigate("/member/notifications")}
            className="relative w-[38px] h-[38px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex-shrink-0"
          >
            <Bell size={17} strokeWidth={1.8} className="text-[#333]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[15px] h-[15px] py-0 px-[3px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Greeting ────────────────────────────────────────────────────── */}
        <div className="pt-1 px-5 pb-5">
          <h1 className="text-2xl font-medium text-[#111] m-0">
            Hi {firstName(data?.user)},
          </h1>
          <p className="text-[13px] text-[#888] mt-[3px] font-normal">
            Here's Your Community At A Glance
          </p>
        </div>

        {/* Mirrors NoCommunityState/PendingApprovalState's layout (same
            icon-circle size, same centering/padding) so the page doesn't
            visibly jump once data resolves into the empty, pending, or
            loaded state. */}
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
            <div className="mx-4 mt-4 bg-surface-container rounded-2xl px-4 pt-4 pb-1 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#111]">
                    Upcoming Payments
                  </span>
                  {/* The true total -- not upcoming.length, which is capped
                      at 3 to keep the card short. Without this, someone
                      with more payments than fit on the card has no way to
                      tell more exist until they tap into the full list. */}
                  {totalUpcomingCount > 0 && (
                    <span className="text-[11px] font-bold text-[#1C2B8A] bg-[#E4E7F9] rounded-full py-px px-[7px] leading-normal">
                      {totalUpcomingCount}
                    </span>
                  )}
                </div>
              </div>

              {upcoming.length === 0 && totalUpcomingCount === 0 ? (
                <div className="flex flex-col items-center px-4 pt-7 pb-5 text-center gap-0">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#EBEBEB] flex items-center justify-center mb-3.5">
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
                  <p className="text-[17px] font-semibold text-[#111] mb-1.5">
                    No Upcoming Payments
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] m-0 leading-[1.55] max-w-[220px]">
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
                className="block w-full pt-1 pb-2.5 bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[#1C2B8A] text-center"
              >
                {hiddenUpcomingCount > 0
                  ? `View All — ${hiddenUpcomingCount} more`
                  : "View All"}
              </button>
            </div>

            {/* ── Payment History ──────────────────────────────────────────────── */}
            <div className="mx-4 mt-4 bg-surface-container rounded-2xl px-4 pt-4 pb-1 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[#111]">
                  Payment History
                </span>
                <button
                  onClick={() => navigate("/member/transactions")}
                  className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-brand p-0"
                >
                  See All
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center px-4 pt-7 pb-5 text-center gap-0">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#EBEBEB] flex items-center justify-center mb-3.5">
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
                  <p className="text-[17px] font-semibold text-[#111] mb-1.5">
                    No Payment History
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] m-0 leading-[1.55] max-w-[230px]">
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
