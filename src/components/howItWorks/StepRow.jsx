import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const isMobileScreen =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

const ICON_POP_CSS = `
@keyframes iconPop {
  0%   { transform: scale(1) rotate(0deg); }
  35%  { transform: scale(1.28) rotate(-6deg); }
  65%  { transform: scale(0.92) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.step-icon-pop { animation: iconPop 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
`;

export default function StepRow({ step, index, innerRef, badgeRef }) {
  const iconRef = useRef(null);
  // Per the Figma reference, the label is always to the left of the image
  // — it never flips. What alternates is the whole card's position: step 1
  // hugs the far right of the section, step 2 the far left, step 3 the far
  // right again. That only works if the row has a fixed width narrower
  // than its (much wider) wrapping container, pushed to one edge via
  // margin — not by reversing flex-row internally.
  const hugRight = index % 2 === 0;
  const { scrollYProgress } = useScroll({
    target: innerRef,
    offset: ["start 90%", "end 10%"],
  });
  // On mobile lock to static values so Framer Motion never writes back to
  // the DOM on every scroll tick — scroll-linked opacity/y is a desktop
  // effect only. useScroll still runs so the icon-pop scroll threshold
  // fires correctly when the row enters the viewport on both breakpoints.
  const rowOpacity = useTransform(
    scrollYProgress,
    isMobileScreen ? [0, 1] : [0, 0.18, 0.75, 1],
    isMobileScreen ? [1, 1] : [0, 1, 1, 0],
  );
  const rowY = useTransform(
    scrollYProgress,
    isMobileScreen ? [0, 1] : [0, 0.18],
    isMobileScreen ? [0, 0] : [40, 0],
  );

  useEffect(() => {
    let fired = false;
    const unsub = scrollYProgress.on("change", (v) => {
      if (!fired && v > 0.12 && iconRef.current) {
        fired = true;
        iconRef.current.classList.add("step-icon-pop");
        unsub();
      }
    });
    return unsub;
  }, [scrollYProgress]);

  const glassCardCls = isMobileScreen
    ? "bg-white border border-white/80 shadow-[0_8px_30px_rgba(15,29,110,0.1)]"
    : "bg-white/60 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)] border border-white/80 shadow-[0_8px_30px_rgba(15,29,110,0.1)]";
  const glassSurfaceCls = isMobileScreen
    ? "bg-white"
    : "bg-white/85 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]";

  return (
    <>
    <style>{ICON_POP_CSS}</style>
    <motion.div ref={innerRef} style={{ opacity: rowOpacity, y: rowY }}>
      {/* ── Mobile — label overlaps top-left of image ── */}
      <div className="flex flex-col md:hidden relative">
        <div className="relative w-full rounded-lg overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img
            src={step.img}
            alt={step.label}
            className="w-full h-auto block"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
          <div className={`absolute bottom-3 right-3 flex items-center gap-2 rounded-full py-2 px-3.5 border border-white/90 shadow-[0_4px_20px_rgba(15,29,110,0.14)] ${glassSurfaceCls}`}>
            <span className="w-[7px] h-[7px] rounded-full bg-brand flex-shrink-0 inline-block" />
            <span className="text-xs font-bold text-[#0f1d6e]">
              {step.badge}
            </span>
          </div>
        </div>
        <div
          className={`absolute -top-5 -left-2.5 w-[130px] rounded-xl py-3.5 px-3 flex flex-col items-center text-center z-20 ${glassCardCls}`}
        >
          <img
            ref={iconRef}
            src={step.stepIcon}
            alt=""
            className="w-8 h-8 object-contain mb-2"
            loading="lazy"
            decoding="async"
          />
          <p className="text-xs font-bold text-[#0f1d6e] leading-[1.3] m-0">
            {step.label}
          </p>
        </div>
      </div>

      {/* ── Desktop — fixed-width row, pushed to alternating edges ── */}
      <div
        className={`hidden md:flex relative items-center w-[min(720px,100%)] ${hugRight ? "ml-auto" : "mr-auto"}`}
      >
        <div
          className={`flex-shrink-0 w-[190px] rounded-2xl p-5 z-20 flex flex-col items-center text-center mr-[-30px] ${glassCardCls}`}
        >
          <img
            ref={iconRef}
            src={step.stepIcon}
            alt=""
            className="w-10 h-10 object-contain mb-2.5"
            loading="lazy"
            decoding="async"
          />
          <p className="text-[13px] font-bold text-[#0f1d6e] leading-snug">{step.label}</p>
        </div>
        <div className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img src={step.img} alt={step.label} className="w-full h-auto block" draggable={false} loading="lazy" decoding="async" />
          <div ref={badgeRef} className={`absolute bottom-4 right-4 flex items-center gap-2 rounded-full py-2.5 px-[18px] border border-white/90 shadow-[0_4px_20px_rgba(15,29,110,0.14)] ${glassSurfaceCls}`}>
            <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0 inline-block" />
            <span className="text-xs font-bold text-[#0f1d6e]">{step.badge}</span>
          </div>
        </div>
        <div className="absolute top-3 right-[-8px] w-[calc(100%-160px)] h-full rounded-3xl border border-[#1C2B8A]/8 bg-[#EEF1FB]/45 -z-10" />
        <div className="absolute top-6 right-[-15px] w-[calc(100%-160px)] h-full rounded-3xl border border-[#1C2B8A]/4 bg-[#E8ECF8]/28 -z-20" />
      </div>
    </motion.div>
    </>
  );
}
