import { useNavigate } from "react-router-dom";
import { ChevronLeft, History } from "lucide-react";
import GlassLogoGlow from "../../../../components/memberApp/GlassLogoGlow";
import useKycFlow from "../../../../components/kyc/useKycFlow";

function StepHeader({ title, onBack, right }) {
  return (
    <div className="flex items-center justify-center relative pt-6 px-5 pb-6">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-5 w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
      )}
      <h1 className="text-lg font-semibold text-[#111] m-0">{title}</h1>
      {right && <div className="absolute right-5">{right}</div>}
    </div>
  );
}

// Member-app identity verification (mobile-only — the device gate keeps
// desktop traffic on the dashboard-styled page). Thin chrome wrapper around
// the shared KYC flow (useKycFlow) — same stepper/steps/footer as the
// dashboard page and the KycWizardModal; the Smile ID state machine stays
// in useKycVerification.
export default function VerifyIdentity() {
  const navigate = useNavigate();
  const flow = useKycFlow({
    onDismiss: () => navigate(-1),
    onHistory: () => navigate("/member/verify-identity/history"),
  });

  return (
    <div className="relative overflow-hidden min-h-screen pb-10">
      <GlassLogoGlow />
      <StepHeader
        title="Identity Verification"
        onBack={() => navigate(-1)}
        right={
          <button
            onClick={() => navigate("/member/verify-identity/history")}
            className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
            aria-label="Attempt history"
          >
            <History size={16} className="text-[#111]" />
          </button>
        }
      />

      <div className="px-4 flex flex-col gap-3">
        {flow.stepper && (
          <div className="rounded-2xl border border-surface-container-border bg-white/70 backdrop-blur-xl px-4 py-3.5">
            {flow.stepper}
          </div>
        )}
        <div className="flex flex-col gap-3">{flow.body}</div>
        {flow.footer && <div className="mt-1 flex">{flow.footer}</div>}
      </div>
    </div>
  );
}
