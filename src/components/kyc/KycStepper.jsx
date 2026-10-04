import { motion, useReducedMotion } from "motion/react";
import { GlyphIdCard, GlyphFaceScan, GlyphStatus } from "./illustrations";

// Horizontal pill-stepper for the KYC wizard. Three states:
//   filled  — done: brand-filled circle + white check, brand-tint pill
//   active  — white pill with a 2px brand outline, brand glyph + label
//   upcoming — muted gray pill + glyph
// Connectors animate their brand fill 0 → 100% between steps instead of
// jumping. Every step gets a custom glyph from the illustration system —
// no library icons here. Named KycStepper to avoid colliding with
// onboarding's StepIndicator (progress bar) and PlanStepIndicator (numbers).
//
// Three steps, not four: the payoff overview is gone — its content is the
// Glass Pass rail, which is visible for the whole flow rather than being a
// screen the user has to pass through.
const KYC_STEPS = [
  { id: "id-type", label: "Pick your ID", Glyph: GlyphIdCard },
  { id: "next-up", label: "What happens next", Glyph: GlyphFaceScan },
  { id: "status", label: "Result", Glyph: GlyphStatus },
];

function kycStepIndex(stepId) {
  const i = KYC_STEPS.findIndex((s) => s.id === stepId);
  return i === -1 ? 0 : i;
}

export default function KycStepper({ current, className = "" }) {
  const reduce = useReducedMotion();
  const activeIndex = kycStepIndex(current);
  const activeStep = KYC_STEPS[activeIndex];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-medium text-ink-faint">
          Step {activeIndex + 1} of {KYC_STEPS.length}
        </span>
        <span className="text-[12px] font-semibold text-ink truncate">{activeStep.label}</span>
      </div>
      {/* Segments rather than labelled pills: the step name is already spelled
          out above, so repeating it three times only crowded the narrow modal. */}
      <ol
        className="flex items-center gap-1 w-full list-none p-0 m-0"
        aria-label="Verification steps"
      >
        {KYC_STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className="flex-1 min-w-0 last:flex-none"
            >
              <motion.span
                className="block h-[3px] rounded-full overflow-hidden"
                style={{ background: "var(--color-stacked-container)" }}
                initial={false}
                animate={{ opacity: done || active ? 1 : 0.55 }}
                transition={{ duration: reduce ? 0 : 0.3 }}
              >
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: "var(--color-brand)" }}
                  initial={false}
                  animate={{ width: done || active ? "100%" : "0%" }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] }}
                />
              </motion.span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
