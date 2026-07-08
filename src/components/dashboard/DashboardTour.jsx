import { useState, useLayoutEffect, useCallback } from "react";
import { LayoutDashboard, Search, ListChecks, Settings, X } from "lucide-react";

export const DASHBOARD_TOUR_SEEN_KEY = "glass_dashboard_tour_seen";

// `target` is a data-tour selector on the real element being described —
// see Sidebar.jsx, Topbar.jsx, and AdminDashboard.jsx for the matching
// data-tour attributes. Steps without a target (intro/outro) just center.
const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Welcome to your dashboard",
    body: "This is where you manage your community's dues, members, and payment plans. Let's take a quick look around.",
    target: null,
  },
  {
    icon: LayoutDashboard,
    title: "Switch communities and pages from the sidebar",
    body: "The sidebar on the left lets you jump between communities you belong to, and move between Dashboard, Payment Plans, Members, Notifications, and Settings.",
    target: '[data-tour="sidebar-nav"]',
  },
  {
    icon: Search,
    title: "Search finds members and payments fast",
    body: "Use the search bar at the top to quickly look up members, transactions, and payment links without leaving the page you're on.",
    target: '[data-tour="topbar-search"]',
  },
  {
    icon: ListChecks,
    title: "Follow your Getting Started checklist",
    body: "New communities see a checklist for the essentials — creating a payment plan, adding members, and setting up your payout account. It updates automatically as you complete each step.",
    target: '[data-tour="getting-started-checklist"]',
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

export default function DashboardTour({ onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const isLast = step === STEPS.length - 1;
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
          className="fixed rounded-xl pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 2px #002FA7",
            transition: "top .2s ease, left .2s ease",
          }}
        />
      )}

      <div
        className="bg-[#EF1EFFE5] rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: "100%", maxWidth: CARD_WIDTH, ...getCardStyle() }}
      >
        <div className="flex items-start justify-between px-6 pt-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#E6EEFF" }}
          >
            <Icon size={20} className="text-[#002FA7]" />
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
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? "#002FA7" : "#E5E7EB",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer border-none hover:opacity-90 transition-opacity"
              style={{ background: "#002FA7" }}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
