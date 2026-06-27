import { motion, useScroll, useTransform } from "framer-motion";

export default function StepRow({ step, index, innerRef }) {
  const isLTR = index % 2 === 0;
  const { scrollYProgress } = useScroll({
    target: innerRef,
    offset: ["start 90%", "end 10%"],
  });
  const rowOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.75, 1],
    [0, 1, 1, 0],
  );
  const rowY = useTransform(scrollYProgress, [0, 0.18], [40, 0]);

  const glassCard = {
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
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 4px 20px rgba(15,29,110,0.14)",
  };

  return (
    <motion.div ref={innerRef} style={{ opacity: rowOpacity, y: rowY }}>
      {/* ── Mobile — label overlaps top-left of image ── */}
      <div className="flex flex-col md:hidden" style={{ position: "relative" }}>
        <div className="relative w-full rounded-lg overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img
            src={step.img}
            alt={step.label}
            className="w-full h-auto block"
            draggable={false}
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
            src={step.stepIcon}
            alt=""
            style={{ width: 32, height: 32, objectFit: "contain", marginBottom: 8 }}
          />
          <p style={{ fontSize: 12, fontWeight: 700, color: "#0f1d6e", lineHeight: 1.3, margin: 0 }}>
            {step.label}
          </p>
        </div>
      </div>

      {/* ── Desktop — alternating left/right rows ── */}
      <div className={`hidden md:flex relative items-center ${isLTR ? "flex-row" : "flex-row-reverse"}`}>
        <div
          className={`flex-shrink-0 w-[190px] rounded-2xl p-5 z-20 flex flex-col items-center text-center ${isLTR ? "mr-[-30px]" : "ml-[-30px]"}`}
          style={glassCard}
        >
          <img
            src={step.stepIcon}
            alt=""
            style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 10 }}
          />
          <p className="text-[13px] font-bold text-[#0f1d6e] leading-snug">{step.label}</p>
        </div>
        <div className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img src={step.img} alt={step.label} className="w-full h-auto block" draggable={false} />
          <div style={{ ...glassBadge, bottom: 16, right: 16, padding: "10px 18px" }}>
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
        <div
          className={`absolute top-3 ${isLTR ? "right-[-8px]" : "left-[-8px]"} w-[calc(100%-160px)] h-full rounded-3xl border border-[#1C2B8A]/8 bg-[#EEF1FB]/45 -z-10`}
        />
        <div
          className={`absolute top-6 ${isLTR ? "right-[-15px]" : "left-[-15px]"} w-[calc(100%-160px)] h-full rounded-3xl border border-[#1C2B8A]/4 bg-[#E8ECF8]/28 -z-20`}
        />
      </div>
    </motion.div>
  );
}
