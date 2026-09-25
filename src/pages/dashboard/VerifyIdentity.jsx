import { useNavigate } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import useKycFlow from "../../components/kyc/useKycFlow";

// Dashboard-styled identity verification — the desktop counterpart to the
// member app's /member/verify-identity (which stays behind the mobile-only
// device gate). Thin chrome wrapper around the shared KYC flow
// (useKycFlow): the same stepper/steps/footer the KycWizardModal renders,
// laid out inline instead of in a modal, so deep links and the modal can't
// drift apart. The Smile ID state machine itself lives in
// useKycVerification — this file only supplies the page shell.
//
// The root carries bg-mobile-auth-default — the same left-center glow
// backdrop MemberAppLayout puts behind every member-app page — so the
// verification surface keeps the branded backdrop inside the dashboard.
export default function VerifyIdentity() {
  const navigate = useNavigate();
  const flow = useKycFlow({
    onDismiss: () => navigate("/dashboard/home"),
    onHistory: () => navigate("/dashboard/verify-identity/history"),
  });

  return (
    <div className="relative flex flex-col min-h-full bg-cover bg-center bg-no-repeat bg-mobile-auth-default">
      {/* Header — dashboard page-header pattern (see CommunitiesHome) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-7 pt-7 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard/home")}
            aria-label="Back to communities"
            className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={17} strokeWidth={2} className="text-[#111]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[#000000] m-0">Identity Verification</h1>
            <p className="text-xs text-gray-400 mt-0.5 m-0">
              Required to create and manage communities.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard/verify-identity/history")}
          className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
          aria-label="Attempt history"
        >
          <History size={16} className="text-[#111]" />
        </button>
      </div>

      <div className="px-4 md:px-7 pb-10 flex flex-col gap-3 w-full max-w-[640px]">
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
