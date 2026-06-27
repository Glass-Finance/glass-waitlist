import { createRef, useRef } from "react";
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

  return (
    <section className="relative bg-[#F7F8FC] overflow-hidden py-24" id="how-it-works">
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
            Set up your community, link member payment methods, and let Glass handle the rest.
          </p>
        </div>

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={step.num}>
              <StepRow step={step} index={i} innerRef={stepRefs[i]} />
              {i < steps.length - 1 && (
                <>
                  <MobileDivider />
                  <StepConnector fromDir={i % 2 === 0 ? "ltr" : "rtl"} stepRef={stepRefs[i]} />
                </>
              )}
            </div>
          ))}
        </div>

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
