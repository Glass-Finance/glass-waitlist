import { useState, useLayoutEffect, useCallback } from "react";
import { LayoutDashboard, Building2, Search, Plus, ListChecks, Receipt, Settings, X } from "lucide-react";

export const DASHBOARD_TOUR_SEEN_KEY = "glass_dashboard_tour_seen";

// `target` is a data-tour selector on the real element being described —
// see Sidebar.jsx, Topbar.jsx, AdminDashboard.jsx, and
// MemberPaymentsSection.jsx for the matching data-tour attributes. Steps
// without a target (intro/outro) just center.
const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Welcome to your dashboard",
    body: "This is where you manage your community's dues, members, and payment plans. Let's take a quick look around.",
    target: null,
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

// A step with a non-null target only makes sense to show while its real
// on-page element exists (e.g. the getting-started checklist disappears
// once a community has both a plan and members) -- otherwise it renders as
// an orphaned centered card highlighting nothing, which reads as a broken
// or skipped step rather than an intentional intro/outro screen.
function findValidStep(from, direction) {
  let i = from + direction;
  while (i >= 0 && i < STEPS.length) {
    const t = STEPS[i].target;
    if (!t || document.querySelector(t)) return i;
    i += direction;
  }
  return null;
}

export default function DashboardTour({ onClose, onNeedMobileNav }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const nextStep = findValidStep(step, 1);
  const prevStep = findValidStep(step, -1);
  const isLast = nextStep === null;
  const current = STEPS[step];
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
    if (!el) {
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

  // Position the tooltip card next to the highlighted element (below it,
  // or above if there's no room), clamped inside the viewport.
  function getCardStyle() {
    if (!rect) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    let top = rect.top + rect.height + CARD_MARGIN;
    const estimatedCardHeight = 230;
    if (top + estimatedCardHeight > viewportH) {
      top = Math.max(rect.top - estimatedCardHeight - CARD_MARGIN, CARD_MARGIN);
    }
    const left = Math.min(Math.max(rect.left, CARD_MARGIN), viewportW - CARD_WIDTH - CARD_MARGIN);
    return { position: "fixed", top, left };
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
        className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-[380px]"
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
            {STEPS.map((_, i) => (
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
            <button
              onClick={() => (isLast ? onClose() : setStep(nextStep))}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer border-none hover:opacity-90 transition-opacity bg-brand"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
