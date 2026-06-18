import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Overlay from "../../assets/Overlay2.png";

import work1 from "../../assets/work/work1.jpg";
import work2 from "../../assets/work/work2.jpg";
import work3 from "../../assets/work/work3.jpg";
import work4 from "../../assets/work/work4.jpg";
import stepIcon1 from "../../assets/icon/step1.png";
import stepIcon2 from "../../assets/icon/step2.png";
import stepIcon3 from "../../assets/icon/step3.png";
import stepIcon4 from "../../assets/icon/step4.png";

const steps = [
  {
    num: "01",
    label: "Create Your Community",
    desc: "Set up your organisation in minutes — no paperwork, no bank visits.",
    badge: "Set Up With Few Clicks",
    img: work1,
    stepIcon: stepIcon1,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    num: "02",
    label: "Add Members",
    desc: "Invite by phone or email, or bulk-import your roster via CSV instantly.",
    badge: "Upload CSV For Bulk Addition",
    img: work2,
    stepIcon: stepIcon2,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    num: "03",
    label: "Set Payment Schedule",
    desc: "Define dues, set deadlines — monthly, yearly, or custom. Glass reconciles everything.",
    badge: "Set Your Dues Structure",
    img: work3,
    stepIcon: stepIcon3,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    num: "04",
    label: "Go Live!",
    desc: "Activate your community. Payments run automatically, receipts sent instantly.",
    badge: "Activate Your Community",
    img: work4,
    stepIcon: stepIcon4,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
];

function StepConnector({ fromDir, stepRef, connId }) {
  const { scrollYProgress } = useScroll({
    target: stepRef,
    offset: ["center center", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.5, 0.88, 1],
    [0, 0, 1, 1, 0],
  );
  const isLTR = fromDir === "ltr";
  const fId = `gf-${connId}`;
  const gId = `gg-${connId}`;
  const R = 60;
  const offsets = [0, 14, 26];
  const strokeW = [1.6, 1.0, 0.6];
  const glowW = [9, 6, 3.5];
  const alphas = [1, 0.55, 0.28];
  const delays = [0.5, 0.72, 0.92];

  const makePath = (off) => {
    if (isLTR) {
      const x1 = 975 - off,
        x2 = 25 + off,
        yTop = 5,
        yMid = 110,
        yBot = 215;
      return [
        `M ${x1} ${yTop}`,
        `L ${x1} ${yMid - R}`,
        `C ${x1} ${yMid} ${x1} ${yMid} ${x1 - R} ${yMid}`,
        `L ${x2 + R} ${yMid}`,
        `C ${x2} ${yMid} ${x2} ${yMid} ${x2} ${yMid + R}`,
        `L ${x2} ${yBot}`,
      ].join(" ");
    } else {
      const x1 = 25 + off,
        x2 = 975 - off,
        yTop = 5,
        yMid = 110,
        yBot = 215;
      return [
        `M ${x1} ${yTop}`,
        `L ${x1} ${yMid - R}`,
        `C ${x1} ${yMid} ${x1} ${yMid} ${x1 + R} ${yMid}`,
        `L ${x2 - R} ${yMid}`,
        `C ${x2} ${yMid} ${x2} ${yMid} ${x2} ${yMid + R}`,
        `L ${x2} ${yBot}`,
      ].join(" ");
    }
  };

  return (
    <motion.div
      className="hidden md:block"
      style={{
        opacity,
        height: "200px",
        marginTop: "-10px",
        marginBottom: "-10px",
        position: "relative",
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 1000 220"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
        fill="none"
      >
        <defs>
          <filter id={fId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="1" />
            <stop offset="35%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="65%" stopColor="#7c3aed" stopOpacity="1" />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {offsets.map((off, i) => {
          const d = makePath(off);
          return (
            <g key={i} opacity={alphas[i]}>
              <motion.path
                d={d}
                stroke="#a855f7"
                strokeWidth={glowW[i]}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.28}
                filter={`url(#${fId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{
                  pathLength: {
                    duration: 1.1,
                    ease: [0.22, 1, 0.36, 1],
                    delay: delays[i],
                  },
                  opacity: { duration: 0.35, delay: delays[i] },
                }}
              />
              <motion.path
                d={d}
                stroke={`url(#${gId})`}
                strokeWidth={strokeW[i]}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={i === 0 ? "none" : i === 1 ? "6 9" : "3 11"}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{
                  pathLength: {
                    duration: 1.1,
                    ease: [0.22, 1, 0.36, 1],
                    delay: delays[i],
                  },
                  opacity: { duration: 0.3, delay: delays[i] },
                }}
              />
              <motion.circle
                r={i === 0 ? 3 : i === 1 ? 2 : 1.4}
                fill={i === 0 ? "#f3e8ff" : "#c084fc"}
                filter={`url(#${fId})`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: [0, 1, 1, 0] }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{
                  duration: 1.1,
                  ease: "easeInOut",
                  delay: delays[i],
                }}
              >
                <animateMotion
                  dur="1.4s"
                  begin={`${delays[i]}s`}
                  repeatCount="indefinite"
                  path={d}
                />
              </motion.circle>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

function MobileDivider() {
  return (
    <div className="flex md:hidden items-center justify-center gap-[5px] py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-px rounded-full"
          style={{
            height: 32,
            background:
              "linear-gradient(to bottom, rgba(168,85,247,0.7), rgba(99,102,241,0.4))",
          }}
          animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function StepRow({ step, index, innerRef }) {
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
    background: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.45)",
    boxShadow: "0 4px 24px rgba(28,43,138,0.08)",
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
    background: "rgba(255,255,255,0.22)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.45)",
    boxShadow: "0 4px 20px rgba(28,43,138,0.12)",
  };

  return (
    <motion.div ref={innerRef} style={{ opacity: rowOpacity, y: rowY }}>
      {/* ── Mobile — label overlaps top of image ── */}
      <div className="flex flex-col md:hidden" style={{ position: "relative" }}>
        {/* Image card — full width */}
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
                background: "#1C2B8A",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#0f1d6e" }}>
              {step.badge}
            </span>
          </div>
        </div>
        <div
          style={{
            ...glassCard,
            position: "absolute",
            top: -24,
            left: -12,
            width: 130,
            borderRadius: "4px",
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
            style={{
              width: 32,
              height: 32,
              objectFit: "contain",
              marginBottom: 8,
            }}
          />
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#0f1d6e",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {step.label}
          </p>
        </div>
      </div>
      <div
        className={`hidden md:flex relative items-center ${isLTR ? "flex-row" : "flex-row-reverse"}`}
      >
        <div
          className={`flex-shrink-0 w-[190px] rounded-2xl p-5 z-20 flex flex-col items-center text-center ${isLTR ? "mr-[-34px]" : "ml-[-34px]"}`}
          style={glassCard}
        >
          <img
            src={step.stepIcon}
            alt=""
            style={{
              width: 44,
              height: 44,
              objectFit: "contain",
              marginBottom: 10,
            }}
          />
          <p className="text-[13px] font-bold text-[#0f1d6e] leading-snug">
            {step.label}
          </p>
        </div>
        {/* Image card */}
        <div className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl shadow-[#1C2B8A]/15">
          <img
            src={step.img}
            alt={step.label}
            className="w-full h-auto block"
            draggable={false}
          />
          <div
            style={{
              ...glassBadge,
              bottom: 16,
              right: 16,
              padding: "10px 18px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#1C2B8A",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0f1d6e" }}>
              {step.badge}
            </span>
          </div>
        </div>
        <div
          className={`absolute top-3 ${isLTR ? "right-[-8px]" : "left-[-8px]"} w-[calc(100%-158px)] h-full rounded-3xl border border-[#1C2B8A]/8 bg-[#EEF1FB]/45 -z-10`}
        />
        <div
          className={`absolute top-6 ${isLTR ? "right-[-15px]" : "left-[-15px]"} w-[calc(100%-158px)] h-full rounded-3xl border border-[#1C2B8A]/4 bg-[#E8ECF8]/28 -z-20`}
        />
      </div>
    </motion.div>
  );
}

export default function GetStarted() {
  const navigate = useNavigate();
  const stepRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  return (
    <section
      className="relative bg-[#F7F8FC] overflow-hidden py-24"
      id="how-it-works"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
          <p className="text-[17px] text-[#00000099] max-w-[720px] mx-auto leading-relaxed">
            Set up your community, link member payment methods, and let Glass
            handle the rest.
          </p>
        </div>

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={step.num}>
              <StepRow step={step} index={i} innerRef={stepRefs[i]} />
              {i < steps.length - 1 && (
                <>
                  <MobileDivider />
                  <StepConnector
                    fromDir={i % 2 === 0 ? "ltr" : "rtl"}
                    stepRef={stepRefs[i]}
                    connId={`o${i}`}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12 md:mt-20">
          {/* ── FIXED: useNavigate instead of <a href> ── */}
          <motion.button
            onClick={() => navigate("/onboarding/choose-path")}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex items-center gap-3 bg-[#0f1d6e] text-white font-bold text-[14px] px-8 py-4 rounded-full overflow-hidden shadow-2xl shadow-[#0f1d6e]/25"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
              whileHover={{ translateX: "250%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative z-10">Join Glass</span>
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
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
