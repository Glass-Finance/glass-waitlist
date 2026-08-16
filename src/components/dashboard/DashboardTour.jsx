import { useState, useLayoutEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Building2, Search, Plus, ListChecks, Receipt, Settings, X, Menu, Users, Clock, Grid, HelpCircle, UserPlus } from "lucide-react";
import { Button } from "../ui/Button";

export const DASHBOARD_TOUR_SEEN_KEY = "glass_dashboard_tour_seen";

// `target` is a data-tour selector on the real element being described —
// see Sidebar.jsx, Topbar.jsx, AdminDashboard.jsx, and
// MemberPaymentsSection.jsx for the matching data-tour attributes. Steps
// without a target (intro/outro) just center. A step's target doesn't have
// to exist on every screen size -- findValidStep/measure below both check
// real visibility, not just DOM presence, so e.g. the mobile-menu-button
// step (only rendered md:hidden) is automatically skipped on desktop, and
// topbar-search (only rendered hidden md:block) is automatically skipped
// on mobile, with no separate per-step viewport flag needed.
const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Welcome to your dashboard",
    body: "This is where you manage your community's dues, members, and payment plans. Let's take a quick look around.",
    target: null,
  },
  {
    icon: Menu,
    title: "Everything else lives behind this menu",
    body: "On a phone, tap here any time to get back to your communities, dashboard, payments, members, and settings.",
    target: '[data-tour="mobile-menu-button"]',
  },
  {
    icon: Building2,
    title: "Switch between communities",
    body: "The icon rail on the far left lists every community you help run — tap one to jump straight into managing it.",
    target: '[data-tour="community-switcher"]',
  },
  {
    icon: LayoutDashboard,
    title: "Move between pages",
    body: "Use this list to get to Dashboard, Payments, Members, Notifications, and Settings for the community you're currently in.",
    target: '[data-tour="sidebar-nav"]',
  },
  {
    icon: Search,
    title: "Search finds members and payments fast",
    body: "Use the search bar at the top to quickly look up members, transactions, and payment links without leaving the page you're on.",
    target: '[data-tour="topbar-search"]',
  },
  {
    icon: Plus,
    title: "Create a plan or add a member in one click",
    body: "These two buttons set up a new payment plan or invite a member without leaving this page.",
    target: '[data-tour="dashboard-header-actions"]',
  },
  // These two only exist on a brand-new community's WelcomeEmptyState,
  // which replaces the header-actions/checklist/table above entirely
  // (see AdminDashboard.jsx's isFreshCommunity branch) -- like every other
  // step here, a missing target just gets skipped by findValidStep, so the
  // two groups never both show for the same community, but whichever one
  // actually rendered gets its own steps instead of silently skipping past
  // the most important thing a new admin can do.
  {
    icon: Plus,
    title: "Start with your first payment plan",
    body: "Every collection begins here — set up dues, a one-time fee, or an event payment in a few clicks.",
    target: '[data-tour="welcome-create-plan"]',
  },
  {
    icon: UserPlus,
    title: "Bring your members in",
    body: "Invite everyone with a shareable link, a CSV upload, or one at a time.",
    target: '[data-tour="welcome-add-members"]',
  },
  {
    icon: ListChecks,
    title: "Follow your Getting Started checklist",
    body: "New communities see a checklist for the essentials — creating a payment plan, adding members, and setting up your payout account. It updates automatically as you complete each step.",
    target: '[data-tour="getting-started-checklist"]',
  },
  {
    icon: Receipt,
    title: "Every transaction, in one table",
    body: "Search, sort, and export a community's payments here — each row also has a receipt you can download and hand to a member.",
    target: '[data-tour="member-payments-table"]',
  },
  {
    icon: Settings,
    title: "You're all set",
    body: "That covers the basics. You can always replay this tour from the help icon next to your notifications.",
    target: null,
  },
];

// Shown instead of STEPS when the tour is opened from Community Home (the
// cross-community overview, not a single community's dashboard) -- STEPS
// above is written entirely in singular-community language ("this is where
// you manage your community's dues"), which doesn't fit this page. Kept
// deliberately non-overlapping with STEPS: the sidebar/community-switcher
// steps stay owned by the dashboard tour since they matter most once you're
// actually inside a community.
export const COMMUNITIES_HOME_STEPS = [
  {
    icon: Users,
    title: "Welcome to Your Communities",
    body: "This is your home base across every community you help run or belong to — payments, activity, and notifications from all of them in one place.",
    target: null,
  },
  {
    icon: Plus,
    title: "Start or join a community",
    body: "Create a new community from scratch, or join one you've already been invited to.",
    target: '[data-tour="communities-home-actions"]',
  },
  {
    icon: Clock,
    title: "Everything due, across every community",
    body: "Upcoming payments, recent activity, and notifications from everywhere you're a member — no need to check each community separately.",
    target: '[data-tour="global-overview"]',
  },
  {
    icon: Grid,
    title: "Sort and switch views",
    body: "Reorder your communities or switch between grid and list view, whichever's easier to scan.",
    target: '[data-tour="communities-view-controls"]',
  },
  {
    icon: Building2,
    title: "Tap a community to manage it",
    body: "Click any card to jump straight into that community's dashboard, payments, and members.",
    target: '[data-tour="communities-grid"]',
  },
  {
    icon: HelpCircle,
    title: "That's the overview",
    body: "You can replay this any time from the help icon next to your notifications.",
    target: null,
  },
];

const SPOTLIGHT_PADDING = 8;
const CARD_WIDTH = 380;
const CARD_MARGIN = 16;

// Below Tailwind's `md` breakpoint the sidebar is an off-canvas drawer
// (see Sidebar.jsx) that's translated out of the viewport by default --
// these two steps live inside it, so on mobile the drawer has to be
// opened before their target can actually be seen, not just measured.
const SIDEBAR_TARGETS = new Set([
  '[data-tour="community-switcher"]',
  '[data-tour="sidebar-nav"]',
]);
const MOBILE_QUERY = "(max-width: 767px)";
// Matches Sidebar.jsx's own `duration-300` slide transition.
const SIDEBAR_TRANSITION_MS = 300;

// display:none (topbar-search hidden below md, mobile-menu-button hidden
// at md and up) means "not on this screen size at all" -- distinct from
// the sidebar drawer's off-canvas state, which uses a transform (still
// display:flex, just translated outside the viewport) precisely so this
// check does NOT disqualify it; that's what the drawer-open effect below
// is for. Checking real DOM presence alone (the old check) let a
// display:none target still count as "valid," which highlighted a
// zero-size phantom box for a UI element the current screen size doesn't
// even render.
function isRenderable(el) {
  if (!el) return false;
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

// A step with a non-null target only makes sense to show while its real
// on-page element exists and is actually renderable at this screen size
// (e.g. the getting-started checklist disappears once a community has
// both a plan and members) -- otherwise it renders as an orphaned
// centered card highlighting nothing, which reads as a broken or skipped
// step rather than an intentional intro/outro screen.
function findValidStep(steps, from, direction) {
  let i = from + direction;
  while (i >= 0 && i < steps.length) {
    const t = steps[i].target;
    if (!t || isRenderable(document.querySelector(t))) return i;
    i += direction;
  }
  return null;
}

export default function DashboardTour({ onClose, onNeedMobileNav, steps = STEPS }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);
  // Real measured height of the rendered card -- on a narrow phone the card
  // is narrower (see cardWidth below), so the same body text wraps onto
  // more lines than on desktop and grows taller. A fixed estimate here
  // under-shoots on mobile specifically, which threw off both the
  // flip-above-if-no-room decision and the top clamp. Starts at the old
  // constant so the very first paint (before this can measure anything)
  // still has a sane guess.
  const [cardHeight, setCardHeight] = useState(230);
  const nextStep = findValidStep(steps, step, 1);
  const prevStep = findValidStep(steps, step, -1);
  const isLast = nextStep === null;
  const current = steps[step];
  const Icon = current.icon;

  // Locate the real on-page element for this step and measure it. Falls
  // back to a centered card (rect = null) if there's no target for this
  // step, or the target isn't currently on screen (e.g. a different
  // community page, or the checklist was already dismissed).
  const measure = useCallback(() => {
    if (!current.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    // Defensive, not load-bearing: findValidStep already keeps display:none
    // targets from becoming the active step, but a live viewport resize
    // (e.g. rotating the phone) while a step is already showing could still
    // make its target display:none mid-view -- fall back to a centered
    // card instead of measuring a box that isn't actually on screen.
    if (!el || !isRenderable(el)) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - SPOTLIGHT_PADDING,
      left: r.left - SPOTLIGHT_PADDING,
      width: r.width + SPOTLIGHT_PADDING * 2,
      height: r.height + SPOTLIGHT_PADDING * 2,
    });
  }, [current.target]);

  useLayoutEffect(() => {
    measure();
    // scrollIntoView is async — re-measure a frame later once it settles.
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Open the mobile sidebar drawer for the two steps that live inside it,
  // close it again for every other step. The drawer's own slide-in
  // transition means its target's rect isn't settled until that finishes,
  // so re-measure once more after it should have.
  useLayoutEffect(() => {
    if (!onNeedMobileNav) return;
    const isMobile = window.matchMedia(MOBILE_QUERY).matches;
    const needsDrawerOpen = isMobile && SIDEBAR_TARGETS.has(current.target);
    onNeedMobileNav(needsDrawerOpen);
    if (!needsDrawerOpen) return;
    const t = setTimeout(measure, SIDEBAR_TRANSITION_MS + 20);
    return () => clearTimeout(t);
  }, [current.target, onNeedMobileNav, measure]);

  // Leave the drawer the way we found it once the tour itself is closed.
  useLayoutEffect(() => {
    return () => onNeedMobileNav?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only cleanup
  }, []);

  // Re-measure the card's real rendered height whenever the step (different
  // body copy) or the available width changes -- runs before paint, so this
  // settles before the user ever sees the stale height's positioning.
  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.getBoundingClientRect().height);
  });

  // Position the tooltip card next to the highlighted element -- below it,
  // or above if there's more room that way. cardWidth is derived the same
  // way the card's own inline width is set
  // below, so this math is always clamping against the width the card
  // actually renders at -- previously it assumed the full CARD_WIDTH even
  // on phones narrower than that (~412px, i.e. most phones), which pushed
  // `left` negative and clipped the card off the left edge of the screen.
  //
  // Picking "below" unconditionally (only falling back to "above" if below
  // overflowed the viewport) worked for small targets, but a tall,
  // full-width target near the top of the page -- e.g. the Getting Started
  // checklist, or the communities grid -- could fail to fit on *either*
  // side, and the old fallback then clamped straight into the spotlighted
  // rect instead of just the viewport, so the card sat on top of the very
  // thing it was pointing at. Comparing the real space on each side and
  // clamping the card to its own side (never past the rect's near edge)
  // guarantees the two never overlap, even if that means the card runs a
  // little past the *opposite* viewport edge in a genuinely tight spot.
  function getCardStyle() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const cardWidth = Math.min(CARD_WIDTH, viewportW - CARD_MARGIN * 2);

    if (!rect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: cardWidth,
      };
    }

    const rectBottom = rect.top + rect.height;
    const spaceBelow = viewportH - rectBottom - CARD_MARGIN;
    const spaceAbove = rect.top - CARD_MARGIN;

    // Sitting flush against whichever side has more room is enough on its
    // own to guarantee no overlap -- below never starts before rectBottom,
    // above never ends after rect.top -- so there's deliberately no further
    // viewport clamp here that could pull the card back toward the rect.
    const top = spaceBelow >= spaceAbove
      ? rectBottom + CARD_MARGIN
      : rect.top - cardHeight - CARD_MARGIN;

    const left = Math.min(Math.max(rect.left, CARD_MARGIN), viewportW - cardWidth - CARD_MARGIN);
    return { position: "fixed", top, left, width: cardWidth };
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Dimmed backdrop with a cut-out spotlight around the highlighted element */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
      </svg>

      {/* Highlight ring around the spotlighted element */}
      {rect && (
        <div
          className="fixed rounded-xl pointer-events-none shadow-[0_0_0_2px_#002FA7] transition-[top,left] duration-200 ease-in-out"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={getCardStyle()}
      >
        <div className="flex items-start justify-between px-6 pt-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-tint"
          >
            <Icon size={20} className="text-brand" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer bg-transparent border-none transition-colors"
            aria-label="Close tour"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <h2 className="text-base font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all h-1.5 ${i === step ? "w-4 bg-brand" : "w-1.5 bg-surface-container-border"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {prevStep !== null && (
              <button
                onClick={() => setStep(prevStep)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Back
              </button>
            )}
            <Button
              onClick={() => (isLast ? onClose() : setStep(nextStep))}
              fullWidth={false}
              size="sm"
              className="px-4"
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
