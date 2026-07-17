import { ONBOARDING_STEPS } from "../../utils/onboardingSteps";

// Lightweight "Step X of Y" + progress bar for the two onboarding screens
// with no room for a full sidebar (ChoosePath, PayingMember) -- the later
// three screens show the same steps in more detail via their own sidebar
// (see the shared ONBOARDING_STEPS list both pull from).
export default function StepIndicator({ stepId }) {
  const index = ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
  const current = index + 1;
  const total = ONBOARDING_STEPS.length;
  const pct = (current / total) * 100;

  return (
    <div className="w-full max-w-xs mx-auto mb-5">
      <p className="text-xs font-medium text-gray-400 text-center mb-1.5">
        Step {current} of {total}
      </p>
      <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "var(--color-brand)" }}
        />
      </div>
    </div>
  );
}
