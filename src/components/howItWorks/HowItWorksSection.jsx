import { createRef, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import StepRow from "./StepRow";
import StepConnector from "./StepConnector";
import MobileDivider from "./MobileDivider";

// Shared by both the organizations and members landing pages — same
// structure, steps/CTA differ per caller.
export default function HowItWorksSection({ steps, onCtaClick, ctaLabel = "Join Glass" }) {
  // createRef() (a plain function) instead of useRef() inside .map() —
  // calling useRef() in a loop violates the Rules of Hooks. Wrapping the
  // whole array in one useRef() keeps the ref objects stable across
  // re-renders while only calling the hook itself once.
  const stepRefs = useRef(steps.map(() => createRef())).current;
  const badgeRefs = useRef(steps.map(() => createRef())).current;
  const stackRef = useRef(null);
  const [badgePoints, setBadgePoints] = useState([]);
  const [bendYs, setBendYs] = useState([]);

  // Connector lines anchor to the actual rendered badge elements (per the
  // Figma reference, the lines run badge-to-badge) rather than a guessed
  // fixed offset — so they stay correct regardless of image aspect ratio
  // or how much text wraps in a badge. The horizontal bend of each curve
  // is kept separate from the badge midpoint: badge 2 sits near the
  // *bottom* of its own card, so averaging the two badge Y positions would
  // push the bend deep inside card 2 — invisible, since rows render above
  // the connector SVG. Using the midpoint of the actual gap between row i
  // and row i+1 instead keeps the visible curve in the space that's
  // actually empty. Re-measures on resize and on the stack's own size
  // changing (e.g. images finishing load shifts row heights).
  useLayoutEffect(() => {
    function measure() {
      if (!stackRef.current) return;
      const containerRect = stackRef.current.getBoundingClientRect();
      const toLocal = (r) => ({
        x: r.left + r.width / 2 - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top,
      });
      const points = badgeRefs.map((ref) => {
        const el = ref.current;
        return el ? toLocal(el.getBoundingClientRect()) : null;
      });
      const rowRects = stepRefs.map((ref) => ref.current?.getBoundingClientRect() ?? null);
      const bends = rowRects.slice(0, -1).map((rect, i) => {
        const next = rowRects[i + 1];
        if (!rect || !next) return null;
        const top = rect.bottom - containerRect.top;
        const bottom = next.top - containerRect.top;
        return (top + bottom) / 2;
      });
      setBadgePoints(points);
      setBendYs(bends);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (stackRef.current) ro.observe(stackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative bg-[#F7F8FC] overflow-hidden py-24" id="how-it-works">
      <div className="hidden sm:block absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[8%] left-[4%] w-[360px] h-[360px] rounded-full bg-indigo-200/15 blur-[100px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[8%] right-[4%] w-[300px] h-[300px] rounded-full bg-purple-200/12 blur-[90px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 13, repeat: Infinity, delay: 4 }}
        />
      </div>

      <div className="relative z-10 max-w-[880px] mx-auto px-6">
        <div className="text-center mb-12 md:mb-20">
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center border border-[#1C2B8A]/20 text-[#1C2B8A] text-[12px] font-semibold px-5 py-2 rounded-full mb-7"
          >
            How We Work
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(26px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-5"
          >
            Launch Transparent Payments
            <br className="hidden md:block" /> in Minutes
          </motion.h2>
          <motion.p
            className="text-[17px] text-[#00000099] max-w-[720px] mx-auto leading-relaxed"
            initial={{ clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            Set up your community, link member payment methods, and let Glass handle the rest.
          </motion.p>
        </div>
      </div>

      {/* Wider than the heading on purpose — each row is a fixed-width
          card pushed to alternating edges (far right, far left, far
          right...), per the Figma reference. Constraining this to the
          heading's 880px column leaves no room for that swing. */}
      <div className="relative z-10 max-w-[1180px] mx-auto px-6 md:px-10">
        <div ref={stackRef} className="relative flex flex-col">
          {/* z-index below the rows (which get an explicit z-10 below) so
              the part of each line that would otherwise cross a card's
              face is hidden behind it — only the segments in the gaps
              between rows end up visible, matching the Figma reference. */}
          <svg
            className="hidden md:block pointer-events-none absolute inset-0"
            style={{ width: "100%", height: "100%", overflow: "visible", zIndex: 0 }}
            fill="none"
          >
            {steps.slice(0, -1).map((step, i) => {
              const p1 = badgePoints[i];
              const p2 = badgePoints[i + 1];
              if (!p1 || !p2) return null;
              return (
                <StepConnector
                  key={step.num}
                  p1={p1}
                  p2={p2}
                  bendY={bendYs[i]}
                  stepRef={stepRefs[i]}
                />
              );
            })}
          </svg>

          {steps.map((step, i) => (
            <div key={step.num} className="relative" style={{ zIndex: 10 }}>
              <StepRow step={step} index={i} innerRef={stepRefs[i]} badgeRef={badgeRefs[i]} />
              {i < steps.length - 1 && <MobileDivider />}
              {i < steps.length - 1 && <div className="hidden md:block" style={{ height: 90 }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-[880px] mx-auto px-6">
        <div className="flex justify-center mt-12 md:mt-20">
          <motion.button
            onClick={onCtaClick}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex items-center gap-3 bg-[#0f1d6e] text-white font-bold text-[14px] px-8 py-4 rounded-full overflow-hidden shadow-2xl shadow-[#0f1d6e]/25"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
              whileHover={{ translateX: "250%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative z-10">{ctaLabel}</span>
            <motion.svg
              className="relative z-10"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
