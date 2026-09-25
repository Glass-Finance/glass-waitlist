import { motion, useReducedMotion } from "motion/react";
import {
  GlyphOverview,
  GlyphIdCard,
  GlyphFaceScan,
  GlyphStatus,
  GlyphCheckMark,
} from "./illustrations";

// Horizontal pill-stepper for the KYC wizard (brief item 1). Three states:
//   filled  — done: brand-filled circle + white check, brand-tint pill
//   active  — white pill with a 2px brand outline, brand glyph + label
//   upcoming — muted gray pill + glyph
// Connectors animate their brand fill 0 → 100% between steps instead of
// jumping. Every step gets a custom glyph from the illustration system —
// no library icons here. Named KycStepper to avoid colliding with
// onboarding's StepIndicator (progress bar) and PlanStepIndicator (numbers).
const KYC_STEPS = [
  { id: "overview", label: "Overview", Glyph: GlyphOverview },
  { id: "id-type", label: "ID type", Glyph: GlyphIdCard },
  { id: "capture", label: "Capture", Glyph: GlyphFaceScan },
  { id: "status", label: "Status", Glyph: GlyphStatus },
];

function kycStepIndex(stepId) {
  const i = KYC_STEPS.findIndex((s) => s.id === stepId);
  return i === -1 ? 0 : i;
}

export default function KycStepper({ current, className = "" }) {
  const reduce = useReducedMotion();
  const activeIndex = kycStepIndex(current);

  return (
    <ol
      className={`flex items-center gap-1 w-full list-none p-0 m-0 ${className}`}
      aria-label="Verification steps"
    >
      {KYC_STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const state = done ? "done" : active ? "active" : "upcoming";
        const { Glyph } = step;
        return (
          <li
            key={step.id}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-1 flex-1 min-w-0 last:flex-none"
          >
            <div
              className={[
                "flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors duration-300",
                state === "done"
                  ? "bg-brand-tint"
                  : state === "active"
                    ? "bg-white ring-2 ring-brand shadow-[0_1px_3px_rgba(0,47,167,0.12)]"
                    : "bg-stacked-container",
              ].join(" ")}
            >
              <span
                className={[
                  "w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0",
                  state === "done"
                    ? "bg-brand text-white"
                    : state === "active"
                      ? "bg-brand-tint text-brand"
                      : "bg-white/70 text-[#9CA3AF]",
                ].join(" ")}
              >
                {done ? (
                  <motion.span
                    key="check"
                    className="flex items-center justify-center text-white"
                    initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  >
                    <GlyphCheckMark size={11} />
                  </motion.span>
                ) : (
                  <Glyph size={12} />
                )}
              </span>
              <span
                className={[
                  "text-[10px] whitespace-nowrap leading-none",
                  state === "done"
                    ? "text-brand font-medium"
                    : state === "active"
                      ? "text-brand font-semibold"
                      : "text-[#9CA3AF] font-medium",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {i < KYC_STEPS.length - 1 && (
              <div className="flex-1 min-w-[8px] h-[2px] mx-0.5 rounded-full bg-gray-200 overflow-hidden self-start mt-[13px]">
                <motion.div
                  className="h-full bg-brand rounded-full"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
