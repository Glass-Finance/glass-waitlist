import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import work1 from "../../assets/work1.png";
import work2 from "../../assets/work2.png";
import work3 from "../../assets/work3.png";
import work4 from "../../assets/work4.png";

const steps = [
  {
    num: "01", label: "Get Invited",
    desc: "Receive an invite link from your admin via WhatsApp or SMS. One tap and you're in.",
    badge: "Instant Access", img: work1,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    num: "02", label: "Create Account",
    desc: "Sign up in under 60 seconds. Verify your phone — no long forms, no waiting.",
    badge: "No Long Forms", img: work2,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    num: "03", label: "Set Up Payment",
    desc: "Add your card, bank, or USSD once. Glass stores it securely — never re-enter it.",
    badge: "Card · Bank · USSD", img: work3,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  {
    num: "04", label: "Auto-Pay!",
    desc: "Dues deducted automatically on your due date. Official receipt sent instantly every time.",
    badge: "Receipt Sent Instantly", img: work4,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
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
    [0,  0,    1,   1,    0]
  );

  const isRTL = fromDir === "rtl";
  const fId = `mgf-${connId}`;
  const gId = `mgg-${connId}`;

  const R = 60;
  const offsets  = [0, 14, 26];
  const strokeW  = [1.6, 1.0, 0.6];
  const glowW    = [9,   6,   3.5];
  const alphas   = [1,   0.55, 0.28];
  const delays   = [0.5, 0.72, 0.92];

  const makePath = (off) => {
    const yTop = 5, yMid = 110, yBot = 215;
    if (isRTL) {
      // Exit from LEFT side → cross to RIGHT
      const x1 = 25  + off;
      const x2 = 975 - off;
      return [
        `M ${x1} ${yTop}`,
        `L ${x1} ${yMid - R}`,
        `C ${x1} ${yMid} ${x1} ${yMid} ${x1 + R} ${yMid}`,
        `L ${x2 - R} ${yMid}`,
        `C ${x2} ${yMid} ${x2} ${yMid} ${x2} ${yMid + R}`,
        `L ${x2} ${yBot}`,
      ].join(" ");
    } else {
      // Exit from RIGHT side → cross to LEFT
      const x1 = 975 - off;
      const x2 = 25  + off;
      return [
        `M ${x1} ${yTop}`,
        `L ${x1} ${yMid - R}`,
        `C ${x1} ${yMid} ${x1} ${yMid} ${x1 - R} ${yMid}`,
        `L ${x2 + R} ${yMid}`,
        `C ${x2} ${yMid} ${x2} ${yMid} ${x2} ${yMid + R}`,
        `L ${x2} ${yBot}`,
      ].join(" ");
    }
  };

  return (
    <motion.div
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
            <stop offset="0%"   stopColor="#e9d5ff" stopOpacity="1"   />
            <stop offset="35%"  stopColor="#a855f7" stopOpacity="1"   />
            <stop offset="65%"  stopColor="#7c3aed" stopOpacity="1"   />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {offsets.map((off, i) => {
          const d = makePath(off);
          return (
            <g key={i} opacity={alphas[i]}>
              <motion.path
                d={d} stroke="#a855f7" strokeWidth={glowW[i]}
                strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.28}
                filter={`url(#${fId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{
                  pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: delays[i] },
                  opacity:    { duration: 0.35, delay: delays[i] },
                }}
              />
              <motion.path
                d={d} stroke={`url(#${gId})`} strokeWidth={strokeW[i]}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={i === 0 ? "none" : i === 1 ? "6 9" : "3 11"}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{
                  pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: delays[i] },
                  opacity:    { duration: 0.3, delay: delays[i] },
                }}
              />
              <motion.circle
                r={i === 0 ? 3 : i === 1 ? 2 : 1.4}
                fill={i === 0 ? "#f3e8ff" : "#c084fc"}
                filter={`url(#${fId})`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: [0, 1, 1, 0] }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{ duration: 1.1, ease: "easeInOut", delay: delays[i] }}
              >
                <animateMotion dur="1.4s" begin={`${delays[i]}s`} repeatCount="indefinite" path={d} />
              </motion.circle>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

function StepRow({ step, index, innerRef }) {
  const isRTL = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: innerRef,
    offset: ["start 90%", "end 10%"],
  });
  const rowOpacity = useTransform(scrollYProgress, [0, 0.18, 0.75, 1], [0, 1, 1, 0]);
  const rowY       = useTransform(scrollYProgress, [0, 0.18],           [40, 0]);

  return (
    <motion.div
      ref={innerRef}
      style={{ opacity: rowOpacity, y: rowY }}
      className={`relative flex items-center ${isRTL ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex-shrink-0 w-[190px] bg-white rounded-2xl shadow-xl shadow-black/10 p-5 z-20
          ${isRTL ? "ml-[-34px]" : "mr-[-34px]"}`}
      >
        <div className="w-8 h-8 rounded-xl bg-[#EEF1FB] flex items-center justify-center text-[#1C2B8A] mb-3">
          {step.icon}
        </div>
        <div className="text-[9px] font-black text-[#9099b2] tracking-widest mb-1 uppercase">Step {step.num}</div>
        <p className="text-[13px] font-extrabold text-[#0f1d6e] leading-snug">{step.label}</p>
      </div>

      <div
        className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl shadow-[#1C2B8A]/15"
        style={{ aspectRatio: "16/10" }}
      >
        <img src={step.img} alt={step.label} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 60%,rgba(0,0,0,0.06) 100%)" }} />
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <motion.span
            animate={{ scale: [1, 1.7, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-[#1C2B8A]"
          />
          <span className="text-[10px] font-black text-[#0f1d6e]">{step.badge}</span>
        </div>
      </div>

      <div className={`absolute top-3 ${isRTL ? "left-[-8px]" : "right-[-8px]"}
        w-[calc(100%-158px)] h-full rounded-3xl border border-[#1C2B8A]/8 bg-[#EEF1FB]/45 -z-10`} />
      <div className={`absolute top-6 ${isRTL ? "left-[-15px]" : "right-[-15px]"}
        w-[calc(100%-158px)] h-full rounded-3xl border border-[#1C2B8A]/4 bg-[#E8ECF8]/28 -z-20`} />
    </motion.div>
  );
}

export default function MembersHowItWorks() {
  const stepRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  return (
    <section className="relative bg-[#F7F8FC] overflow-hidden py-24" id="how-it-works-members">

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[8%] right-[4%] w-[360px] h-[360px] rounded-full bg-indigo-200/15 blur-[100px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[8%] left-[4%] w-[300px] h-[300px] rounded-full bg-purple-200/12 blur-[90px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 13, repeat: Infinity, delay: 4 }}
        />
      </div>

      <div className="relative z-10 max-w-[880px] mx-auto px-6">

        <div className="text-center mb-20">
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
            className="text-[clamp(34px,5vw,58px)] font-extrabold text-[#0f1d6e] leading-tight tracking-tight mb-5"
          >
            Join Your Community
            <br className="hidden md:block" /> In Minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.56, delay: 0.2 }}
            className="text-[15px] text-[#9099b2] max-w-[460px] mx-auto leading-relaxed"
          >
            Enter your invite code and get instant access to your community's payments.
          </motion.p>
        </div>

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={step.num}>
              <StepRow step={step} index={i} innerRef={stepRefs[i]} />
              {i < steps.length - 1 && (
                <StepConnector
                  fromDir={i % 2 === 0 ? "rtl" : "ltr"}
                  stepRef={stepRefs[i]}
                  connId={`m${i}`}
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mt-20"
        >
          <motion.a
            href="/find-community"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex items-center gap-3 bg-[#0f1d6e] text-white font-bold text-[14px] px-8 py-4 rounded-full no-underline overflow-hidden shadow-2xl shadow-[#0f1d6e]/25"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
              whileHover={{ translateX: "250%" }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative z-10">Join Glass</span>
            <motion.svg
              className="relative z-10" width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </motion.a>
        </motion.div>

      </div>
    </section>
  );
}