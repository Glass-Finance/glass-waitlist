import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { KYC_NARRATIVE_LINES } from "./narrativeLines";

// Live-updating status line (brief item 3): replaces the static "Pending"
// label with a short line that cycles in sync with the verification phase,
// paired with a pulsing stage icon. The caller (StatusStep) keys this
// component by phase, so a phase change remounts it and the cycle restarts
// from the top — no setState-in-effect reset needed.
//
// phase → lines mapping lives in narrativeLines.js (module constants).
const CYCLE_MS = 3000;

export default function StatusNarrative({ phase, lines, icon }) {
  const reduce = useReducedMotion();
  const set = lines ?? KYC_NARRATIVE_LINES[phase] ?? KYC_NARRATIVE_LINES.processing;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (set.length < 2) return undefined;
    const id = setInterval(() => setIndex((v) => (v + 1) % set.length), CYCLE_MS);
    return () => clearInterval(id);
    // `set` is a module-level constant array per phase — identity is stable.
  }, [set]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-surface-container-border bg-white px-4 py-3.5">
      <span className="w-10 h-10 rounded-full bg-brand-tint text-brand flex items-center justify-center flex-shrink-0 animate-kyc-pulse">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="h-[18px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={set[index]}
              className="text-[13.5px] font-semibold text-[#111] m-0 leading-[18px] truncate"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -5 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              {set[index]}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="text-[11.5px] text-[#999] m-0 mt-0.5 leading-snug">
          You can keep this window open — we&apos;ll update you the moment it&apos;s done.
        </p>
      </div>
    </div>
  );
}
