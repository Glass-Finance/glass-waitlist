import { useState, useLayoutEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { useEscapeToClose } from "../../hooks/useKeyboardShortcuts";
import { STEPS } from "./dashboardTourSteps";

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
  // A stuck tour (see the viewport clamp in getCardStyle below) previously
  // had no way out at all short of a hard refresh -- Escape is a second,
  // independent path to onClose that doesn't depend on the card's own
  // Close/X button actually being reachable on screen.
  useEscapeToClose(onClose);
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
    // measure() reads the target element's real DOM position (getBoundingClientRect)
    // to place the spotlight overlay -- there's no render-time equivalent
    // for that, it has to run after the DOM commits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // Deliberately no dependency array: both triggers only ever reach this
  // component as *some* re-render (there's no single reactive value to
  // depend on), so it needs to re-measure after every render rather than a
  // specific subset. Self-limiting, not actually infinite: once the
  // measured height matches state, setCardHeight(sameValue) is a no-op via
  // React's same-value bail-out, so it settles within a render or two.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Sitting flush against whichever side has more room avoids overlapping
    // the spotlighted rect in the common case -- below never starts before
    // rectBottom, above never ends after rect.top. But when the rect itself
    // is tall enough to leave neither side with real room (e.g. the
    // Overview cards row), that placement can push the card's own bottom
    // half -- Back/Next/Done live down there -- past the viewport edge.
    // The card is `position: fixed` and this overlay has no scroll
    // container standing in for the page underneath, so an off-screen
    // button isn't just hard to see, it's permanently unreachable (see
    // #142: got stuck on the tour with no way to advance or close it).
    // A final clamp into the viewport is a strictly better fallback than
    // that even though it can overlap the rect in this one pathological
    // case -- a highlight box the tooltip covers a corner of is a small
    // visual glitch; a modal with no reachable buttons is a dead end.
    const rawTop = spaceBelow >= spaceAbove
      ? rectBottom + CARD_MARGIN
      : rect.top - cardHeight - CARD_MARGIN;
    const top = Math.min(
      Math.max(rawTop, CARD_MARGIN),
      Math.max(CARD_MARGIN, viewportH - cardHeight - CARD_MARGIN),
    );

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
