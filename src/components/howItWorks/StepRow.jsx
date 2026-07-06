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

  const glassCard = isMobileScreen
    ? {
        background: "#fff",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 8px 30px rgba(15,29,110,0.1)",
      }
    : {
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 8px 30px rgba(15,29,110,0.1)",
      };
  const glassBadge = {
    position: "absolute",
    bottom: 12,
    right: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    padding: "8px 14px",
    background: isMobileScreen ? "#fff" : "rgba(255,255,255,0.85)",
    ...(isMobileScreen ? {} : { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }),
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 4px 20px rgba(15,29,110,0.14)",
  };

  return (
    <>
    <style>{ICON_POP_CSS}</style>
    <motion.div ref={innerRef} style={{ opacity: rowOpacity, y: rowY }}>
      {/* ── Mobile — label overlaps top-left of image ── */}
      <div className="flex flex-col md:hidden" style={{ position: "relative" }}>
        <div className="relative w-full rounded-lg overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img
            src={step.img}
            alt={step.label}
            className="w-full h-auto block"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
          <div style={glassBadge}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#002FA7",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f1d6e" }}>
              {step.badge}
            </span>
          </div>
        </div>
        <div
          style={{
            ...glassCard,
            position: "absolute",
            top: -20,
            left: -10,
            width: 130,
            borderRadius: 12,
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 20,
          }}
        >
          <img
            ref={iconRef}
            src={step.stepIcon}
            alt=""
            style={{ width: 32, height: 32, objectFit: "contain", marginBottom: 8 }}
            loading="lazy"
            decoding="async"
          />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#0f1d6e", lineHeight: 1.3, margin: 0 }}>
            {step.label}
          </p>
        </div>
      </div>

      {/* ── Desktop — fixed-width row, pushed to alternating edges ── */}
      <div
        className={`hidden md:flex relative items-center w-[min(720px,100%)] ${hugRight ? "ml-auto" : "mr-auto"}`}
      >
        <div
          className="flex-shrink-0 w-[190px] rounded-2xl p-5 z-20 flex flex-col items-center text-center mr-[-30px]"
          style={glassCard}
        >
          <img
            ref={iconRef}
            src={step.stepIcon}
            alt=""
            style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 10 }}
            loading="lazy"
            decoding="async"
          />
          <p className="text-[13px] font-bold text-[#0f1d6e] leading-snug">{step.label}</p>
        </div>
        <div className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img src={step.img} alt={step.label} className="w-full h-auto block" draggable={false} loading="lazy" decoding="async" />
          <div ref={badgeRef} style={{ ...glassBadge, bottom: 16, right: 16, padding: "10px 18px" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#002FA7",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f1d6e" }}>{step.badge}</span>
          </div>
        </div>
        <div className="absolute top-3 right-[-8px] w-[calc(100%-160px)] h-full rounded-3xl border border-[#1C2B8A]/8 bg-[#EEF1FB]/45 -z-10" />
        <div className="absolute top-6 right-[-15px] w-[calc(100%-160px)] h-full rounded-3xl border border-[#1C2B8A]/4 bg-[#E8ECF8]/28 -z-20" />
      </div>
    </motion.div>
    </>
  );
}
