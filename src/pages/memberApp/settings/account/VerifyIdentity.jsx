import { useNavigate } from "react-router-dom";
import { ChevronLeft, History, IdCard, ShieldCheck, Clock, XCircle } from "lucide-react";
import GlassLogoGlow from "../../../../components/memberApp/GlassLogoGlow";
import { Button } from "../../../../components/ui/Button";
import SuccessBadge from "../../../../components/common/SuccessBadge";
import KycStatusBadge from "../../../../components/memberApp/KycStatusBadge";
import PageLoadingState from "../../../../components/memberApp/PageLoadingState";
import { useKycVerification } from "../../../../hooks/useKycVerification";
import { ID_TYPE_OPTIONS, idTypeLabel, kycStatusLabel } from "../../../../utils/kycStatus";
import { getErrorMessage } from "../../../../utils/errorHandler";

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

function Card({ children, className = "" }) {
  return (
    <div className={`border border-surface-container-border bg-white rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

// Member-app identity verification (mobile-only — the device gate keeps
// desktop traffic on the dashboard-styled page). The Smile ID flow itself
// lives in useKycVerification, shared with the dashboard page.
export default function VerifyIdentity() {
  const navigate = useNavigate();
  const {
    summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    idType,
    setIdType,
    localError,
    capturing,
    confirmed,
    status,
    canStart,
    attemptsAllowed,
    handleStart,
    handleResume,
    handleRefreshStatus,
    isApproved,
    isInReview,
    isPending,
    isNotStarted,
    canRetry,
    showResume,
    startPending,
    resumePending,
  } = useKycVerification();

  if (isLoading) {
    return (
      <div className="relative overflow-hidden min-h-screen">
        <GlassLogoGlow />
        <StepHeader title="Identity Verification" onBack={() => navigate(-1)} />
        <PageLoadingState label="Loading your verification status…" />
      </div>
    );
  }

  if (isError && !summary) {
    return (
      <div className="relative overflow-hidden min-h-screen pb-10">
        <GlassLogoGlow />
        <StepHeader title="Identity Verification" onBack={() => navigate(-1)} />
        <div className="px-4">
          <Card>
            <p className="text-sm text-danger m-0">
              {getErrorMessage(error, "Couldn't load your verification status.")}
            </p>
            <Button className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={16} className="text-[#1C2B8A]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#111] m-0">Current status</p>
                <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">
                  {isApproved
                    ? "You're verified for community actions."
                    : "Required to create and manage communities."}
                </p>
              </div>
            </div>
            <KycStatusBadge status={status} />
          </div>

          {(summary?.restrictionReason || summary?.revokedReason || summary?.decisionReason) && (
            <p className="text-xs text-[#6B7280] mt-3 mb-0 leading-relaxed">
              {summary?.restrictionReason ??
                summary?.revokedReason ??
                summary?.decisionReason ??
                ""}
            </p>
          )}

          <button
            onClick={handleRefreshStatus}
            disabled={isFetching}
            className="mt-3 text-xs font-medium text-brand bg-transparent border-none cursor-pointer p-0 disabled:opacity-60"
          >
            {isFetching ? "Refreshing…" : "Check status"}
          </button>
        </Card>

        {confirmed && isPending && (
          <SuccessBadge
            message="Verification submitted"
            subMessage="We'll update you when it's reviewed."
          />
        )}

        {!attemptsAllowed && (summary?.restrictionReason || !canStart) && (
          <Card className="bg-[#FEF2F2] border-[#fecaca]">
            <div className="flex items-start gap-2.5">
              <XCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-danger m-0">New attempts disabled</p>
                <p className="text-xs text-[#6B7280] mt-1 mb-0 leading-relaxed">
                  {summary?.restrictionReason ??
                    "A platform administrator has paused new verification attempts on your account."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {localError && <p className="text-xs text-danger mx-1 mb-0">{localError}</p>}

        {isApproved && (
          <Card>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-success-tint flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={16} className="text-[#15803d]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#111] m-0">Identity verified</p>
                <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">
                  You can create and manage communities.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isInReview && (
          <Card>
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-[#b45309] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#111] m-0">Under review</p>
                <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0 leading-relaxed">
                  Our team is reviewing your results. This usually doesn't take long.
                  {summary?.decisionReason ? ` ${summary.decisionReason}` : ""}
                </p>
              </div>
            </div>
          </Card>
        )}

        {isPending && !showResume && !confirmed && (
          <Card>
            <p className="text-sm font-medium text-[#111] m-0">Verification in progress</p>
            <p className="text-xs text-[#999] mt-1 mb-0 leading-relaxed">
              We're waiting on your verification results. Check status shortly — no need to start
              again.
            </p>
          </Card>
        )}

        {showResume && (
          <Card>
            <p className="text-sm font-medium text-[#111] m-0">Continue verification</p>
            <p className="text-xs text-[#999] mt-1 mb-3 leading-relaxed">
              Your previous session is still open. Resume to finish the Smile ID check.
            </p>
            <Button onClick={handleResume} loading={capturing || resumePending}>
              {capturing ? "Opening Smile ID…" : "Continue"}
            </Button>
          </Card>
        )}

        {canRetry && canStart && attemptsAllowed && !showResume && !isApproved && (
          <Card>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                <IdCard size={16} className="text-[#1C2B8A]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#111] m-0">
                  {isNotStarted ? "Start verification" : "Try again"}
                </p>
                <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">
                  Choose an ID type — the number is entered inside Smile ID, not here.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {ID_TYPE_OPTIONS.map((opt) => {
                const selected = idType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIdType(opt.value)}
                    className={`w-full text-left py-3 px-3.5 rounded-xl border bg-white cursor-pointer text-sm text-[#111] ${
                      selected
                        ? "border-transparent shadow-[0_0_0_2px_#002FA7]"
                        : "border-[#E5E7EB]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <Button className="mt-4" onClick={handleStart} loading={capturing || startPending}>
              {capturing
                ? "Opening Smile ID…"
                : startPending
                  ? "Starting…"
                  : `Continue with ${idTypeLabel(idType)}`}
            </Button>
          </Card>
        )}

        {!canStart && !isApproved && !isInReview && !isPending && attemptsAllowed && (
          <Card>
            <p className="text-sm font-medium text-[#111] m-0">Status: {kycStatusLabel(status)}</p>
            <p className="text-xs text-[#999] mt-1 mb-0 leading-relaxed">
              {summary?.decisionReason ??
                summary?.revokedReason ??
                "You can't start a new attempt right now. Check status or contact support if this seems wrong."}
            </p>
          </Card>
        )}

        <button
          onClick={() => navigate("/member/verify-identity/history")}
          className="mt-1 text-sm font-medium text-brand bg-transparent border-none cursor-pointer p-0 text-center"
        >
          View attempt history
        </button>
      </div>
    </div>
  );
}
