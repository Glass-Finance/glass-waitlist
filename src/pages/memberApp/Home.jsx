import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Bell, Check, ChevronDown, Clock, Mail } from "lucide-react";
import noCommunityIcon from "../../assets/auth/no-community.png";
import paymentsDueIcon from "../../assets/memberApp/icon-payments-due.png";
import upcomingPaymentsIcon from "../../assets/memberApp/icon-upcoming-payments.png";
import paymentHistoryIcon from "../../assets/memberApp/icon-payment-history.png";
import PageLoadingState from "../../components/memberApp/PageLoadingState";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";
import AutoPayPrompt from "../../components/common/AutoPayPrompt";
import { usePayments, usePendingPaymentVerification } from "../../hooks/usePayments";
import { useMyCommunities } from "../../hooks/useMyAccount";
import { useNotifications } from "../../hooks/useNotifications";
import { useInvites, useMyJoinRequests } from "../../hooks/useInvites";
import { useJoinApprovalWatcher } from "../../hooks/useJoinApproval";
import JoinApprovedModal from "../../components/memberApp/JoinApprovedModal";
import SideDrawer from "../../components/memberApp/SideDrawer";
import {
  formatNaira,
  formatDateLong as formatDate,
  formatDate as formatDateShort,
  toTitleCase,
} from "../../utils/format";
import { Button } from "../../components/ui/Button";

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
// Community switcher — the same dropdown whether the member is in one
// community or several: the list always renders (even a list of one), with
// "Browse Your Communities" underneath either way, rather than branching
// into separate single/multi layouts.
// ---------------------------------------------------------------------------
function CommunitySwitcher({
  communities,
  activeIdentifier,
  communityName,
  communityInitial,
  communityLogo,
  onSelect,
  navigate,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
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
          className={`text-[#666] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] bg-surface-container backdrop-blur-md rounded-xl border border-surface-container-border shadow-lg py-1.5">
          {communities.map((c) => {
            const id = c.slug ?? c.id;
            const isActive = id === activeIdentifier;
            return (
              <button
                key={id}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left bg-transparent border-none cursor-pointer hover:bg-[#F7F8FB]"
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden ${c.logo?.url ? "bg-transparent" : "bg-[#1C2B8A]"}`}
                >
                  {c.logo?.url ? (
                    <img src={c.logo.url} alt="" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    (c.name ?? "?").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="flex-1 min-w-0 text-sm text-[#111] truncate">{c.name}</span>
                {isActive && <Check size={15} strokeWidth={2.5} className="text-brand flex-shrink-0" />}
              </button>
            );
          })}

          <div className="h-px bg-surface-container-border/50 my-1.5" />

          <button
            onClick={() => {
              setOpen(false);
              navigate("/member/communities");
            }}
            className="w-full px-3 py-2.5 text-center bg-transparent border-none cursor-pointer text-sm font-normal text-brand"
          >
            Browse Your Communities
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------
function HeroCard({ nextDue, onPay, error, onRefresh }) {
  if (!nextDue) {
    const isError = Boolean(error);
    return (
      <div className="relative mx-4 rounded-lg overflow-hidden bg-white">
        {/* Base ring — always visible, all four sides. */}
        <div className="absolute inset-0 rounded-lg border-[1.5px] border-surface-container-border pointer-events-none" />
        {/* Accent glow — same shape/position as the base ring (inset-0, not
            a % height, so this doesn't hit the abs-positioned-child-of-an-
            auto-height-container bug a previous version of this card ran
            into), faded out via mask-image instead of stopping abruptly, so
            it reads as merging into the base ring rather than a hard cut. */}
        <div
          className={`absolute inset-0 rounded-lg border-[1.5px] pointer-events-none ${isError ? "border-danger" : "border-brand"}`}
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 15%, transparent 55%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 15%, transparent 55%)",
          }}
        />
        <div className="pt-10 px-6 pb-5 flex flex-col items-center">
          {isError ? (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-danger-tint">
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
            </div>
          ) : (
            // The icon asset already carries its own rounded badge
            // background baked in -- an additional wrapping circle here
            // just duplicated it. Sized to the same footprint that circle
            // used to occupy (w-14 = 56px) instead of the tiny w-6 it was
            // shrunk to inside that circle.
            <img src={paymentsDueIcon} alt="" className="w-14 h-14 object-contain" />
          )}
        </div>

        {/* Bottom block — no border */}
        <div className="text-center flex flex-col items-center px-6 pt-2 pb-8">
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
              <p className="text-lg text-[#111] font-normal mb-2 tracking-[-0.2px]">
                No Payments Due
              </p>
              <p className="text-[13px] text-[#9CA3AF] m-0 leading-normal">
                New dues Will Appear Here
              </p>
            </>
          )}
        </div>
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
    <div className="relative mx-4 rounded-lg overflow-hidden bg-white">
      {/* Base ring — always visible, all four sides. */}
      <div className="absolute inset-0 rounded-lg border-[1.5px] border-surface-container-border pointer-events-none" />
      {/* Accent glow — same shape/position as the base ring (inset-0, not a
          % height, so this doesn't hit the abs-positioned-child-of-an-
          auto-height-container bug a previous version of this card ran
          into -- see git history), faded out via mask-image instead of
          stopping abruptly, so it reads as merging into the base ring
          rather than a hard cut. */}
      <div
        className={`absolute inset-0 rounded-lg border-[1.5px] pointer-events-none ${isOverdue ? "border-danger" : "border-brand"}`}
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 15%, transparent 55%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 15%, transparent 55%)",
        }}
      />
      <div className="pt-5 px-5 flex flex-col items-center">
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 pt-[60px] pb-20 text-center">
      {/* Icon */}
      <img
        src={noCommunityIcon}
        alt=""
        className="w-28 h-28 object-contain mb-7 flex-shrink-0"
      />

      <p className="text-lg font-semibold text-[#111] mb-2.5 leading-snug">
        You're not part of any community yet.
      </p>
      <p className="text-sm text-[#888] mb-9 leading-relaxed">
        Join a community or check your invitations to get started.
      </p>

      {/* Primary CTA */}
      <Button
        onClick={() => navigate("/member/communities/search")}
        className="mb-4"
      >
        Join A Community
      </Button>

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
// Empty state — active community has zero activity (no next due, no
// upcoming, no history), and the member belongs to at least one other
// community. Only shown in that specific case -- someone whose one and
// only community happens to be empty still gets the regular Hero/Upcoming/
// History cards below, each with their own "nothing here" copy, since
// "check your other communities" wouldn't make sense for them.
// ---------------------------------------------------------------------------
function NothingHappeningState({ navigate }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pt-[60px] pb-20 text-center">
      <img
        src={noCommunityIcon}
        alt=""
        className="w-28 h-28 object-contain mb-7 flex-shrink-0"
      />

      <p className="text-lg font-semibold text-[#111] mb-2.5 leading-snug">
        Nothing happening here yet.
      </p>
      <p className="text-sm text-[#888] mb-9 leading-relaxed">
        Check out your other communities to see what's happening.
      </p>

      <Button
        onClick={() => navigate("/member/communities/search")}
        className="mb-4"
      >
        Browse Communities
      </Button>

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
    communityCount,
  } = usePayments();
  // Catches payers who came back from Paystack without hitting the callback
  // page — verifies the stored pending reference so Paid shows immediately.
  usePendingPaymentVerification();
  // Unread count for the bell badge — without it members have no signal
  // that anything arrived unless they open the notifications page.
  const { unreadCount } = useNotifications();
  // Badge for the top-bar Invitations icon — personal invites awaiting a
  // response plus the member's own pending join-requests, the same two
  // lists Invites.jsx renders together.
  const { invites } = useInvites();
  const { joinRequests } = useMyJoinRequests();
  const pendingInviteCount =
    invites.filter((i) => (i.status ?? "").toUpperCase() === "PENDING").length +
    joinRequests.length;

  // Backend sends no signal when a join request gets approved (see
  // useJoinApproval.js) -- this watches the same shared communities query
  // usePayments() below already keeps fresh via refetchOnMount, and surfaces
  // a "you're in" popup the moment a tracked request flips to ACTIVE.
  // Previously only mounted on DiscoverCommunities, so approvals for anyone
  // who joined via a direct invite link (never visits that search page)
  // went completely unnoticed.
  const { approved: approvedJoins, dismiss: dismissJoin } = useJoinApprovalWatcher();
  const activeApproval = approvedJoins[0] ?? null;

  function openApprovedCommunity(entry) {
    try {
      localStorage.setItem(
        "glass_member_community",
        JSON.stringify({ id: entry.communityId, slug: entry.communitySlug, name: entry.name }),
      );
    } catch {
      /* ignore */
    }
    dismissJoin(entry);
  }

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
  const history = (data?.history ?? []).slice(0, 3);
  const communityName = data?.community?.name ?? "Your Community";
  const communityInitial = communityName.charAt(0).toUpperCase();
  const communityLogo = data?.community?.logo;
  const activeCommunityIdentifier = data?.community?.slug ?? data?.community?.id ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  // Member's full community list for the switcher dropdown -- shares the
  // ["communities"] query key with usePayments() internally, so this reuses
  // the same cached fetch rather than firing a second request. Only ACTIVE
  // memberships are switchable, same rule usePayments applies -- a pending
  // join request isn't a community the member can view yet.
  const { data: rawMyCommunities = [] } = useMyCommunities();
  const myCommunities = rawMyCommunities
    .filter((c) => (c.memberStatus ?? "ACTIVE").toUpperCase() === "ACTIVE")
    .map((c) => ({
      ...c,
      name: c.name ?? c.community?.name,
      slug: c.slug ?? c.community?.slug,
      logo: c.logo ?? c.community?.logo,
      id: c.id ?? c.community?.id,
    }));

  // usePayments() re-derives its active community from localStorage
  // synchronously on every render rather than via React state, so switching
  // just needs to write the new selection and force a re-render -- no
  // separate refetch call, the payment-links query key already includes the
  // community identifier and picks up the change on its own.
  const [, forceRerender] = useState(0);
  function handleSwitchCommunity(c) {
    try {
      localStorage.setItem(
        "glass_member_community",
        JSON.stringify({ id: c.id, slug: c.slug, name: c.name }),
      );
    } catch {
      /* ignore */
    }
    forceRerender((n) => n + 1);
  }

  // Consolidated "nothing happening" empty state -- replaces the Hero/
  // Upcoming/History cards (each of which would otherwise render its own
  // "nothing here" copy back to back) when the active community truly has
  // no activity at all, and only when there's somewhere else to point the
  // member ("check your other communities" needs a 2nd community to exist).
  const showNothingHappening =
    !hasNoCommunity &&
    !hasPendingCommunity &&
    communityCount >= 2 &&
    !nextDue &&
    totalUpcomingCount === 0 &&
    history.length === 0;

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

            {/* Community switcher — same dropdown component whether the
                member has one community or several. Nothing to show or
                switch between yet when the member isn't in any community,
                so it's dropped for that state entirely. */}
            {!hasNoCommunity && (
              <CommunitySwitcher
                communities={myCommunities}
                activeIdentifier={activeCommunityIdentifier}
                communityName={communityName}
                communityInitial={communityInitial}
                communityLogo={communityLogo}
                onSelect={handleSwitchCommunity}
                navigate={navigate}
              />
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Invitations -- the no-community and nothing-happening empty
                states each already offer their own "Check Your Invites"
                CTA, so the header icon is redundant there. */}
            {!hasNoCommunity && !showNothingHappening && (
              <button
                aria-label="Invitations"
                onClick={() => navigate("/member/invites")}
                className="relative w-[38px] h-[38px] rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <Mail size={17} strokeWidth={1.8} className="text-[#333]" />
                {pendingInviteCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-[15px] py-0 px-[3px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white">
                    {pendingInviteCount > 9 ? "9+" : pendingInviteCount}
                  </span>
                )}
              </button>
            )}

            {/* Bell */}
            <button
              aria-label="Notifications"
              onClick={() => navigate("/member/notifications")}
              className="relative w-[38px] h-[38px] rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center flex-shrink-0"
            >
              <Bell size={17} strokeWidth={1.8} className="text-[#333]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[15px] h-[15px] py-0 px-[3px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Greeting -- skipped for the no-community and nothing-happening
            empty states, per their own Figma (no "Here's Your Community At
            A Glance" over an empty page). ─────────────────────────────── */}
        {!hasNoCommunity && !showNothingHappening && (
          <div className="pt-1 px-5 pb-5">
            <h1 className="text-2xl font-medium text-[#111] m-0">
              Hi {firstName(data?.user)},
            </h1>
            <p className="text-[13px] text-[#888] mt-[3px] font-normal">
              Here's Your Community At A Glance
            </p>
          </div>
        )}

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
        ) : showNothingHappening ? (
          <NothingHappeningState navigate={navigate} />
        ) : (
          <>
            {/* ── Hero card ───────────────────────────────────────────────────── */}
            <HeroCard
              nextDue={nextDue}
              onPay={handlePay}
              error={error}
              onRefresh={refresh}
            />

            {/* ── Upcoming Payments ────────────────────────────────────────────── */}
            <div className="mx-4 mt-4 bg-surface-container rounded-lg px-4 pt-4 pb-1 border border-surface-container-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-normal text-[#111]">
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
                {totalUpcomingCount > 0 && (
                  <button
                    onClick={() => navigate("/member/upcoming")}
                    className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[#9CA3AF] p-0"
                  >
                    See All
                  </button>
                )}
              </div>

              {upcoming.length === 0 && totalUpcomingCount === 0 ? (
                <div className="flex flex-col items-center px-4 pt-7 pb-5 text-center gap-0">
                  <img src={upcomingPaymentsIcon} alt="" className="w-[52px] h-[52px] object-contain mb-3.5" />
                  <p className="text-[17px] font-normal text-[#111] mb-1.5">
                    No Upcoming Payments
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] m-0 leading-[1.55] max-w-[270px]">
                    New Dues from community will show up here once scheduled
                  </p>
                </div>
              ) : (
                upcoming.map((p) => (
                  <UpcomingRow key={p.id} payment={p} onPay={handlePay} />
                ))
              )}
            </div>

            {/* ── Payment History ──────────────────────────────────────────────── */}
            <div className="mx-4 mt-4 bg-surface-container rounded-lg px-4 pt-4 pb-1 border border-surface-container-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-normal text-[#111]">
                  Payment History
                </span>
                {history.length > 0 && (
                  <button
                    onClick={() => navigate("/member/transactions")}
                    className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[#9CA3AF] p-0"
                  >
                    See All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center px-4 pt-7 pb-5 text-center gap-0">
                  <img src={paymentHistoryIcon} alt="" className="w-[52px] h-[52px] object-contain mb-3.5" />
                  <p className="text-[17px] font-normal text-[#111] mb-1.5">
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

      <JoinApprovedModal
        entry={activeApproval}
        onOpen={openApprovedCommunity}
        onDismiss={dismissJoin}
      />
    </>
  );
}
