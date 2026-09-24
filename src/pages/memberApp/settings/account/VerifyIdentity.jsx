import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, History, IdCard, ShieldCheck, Clock, XCircle } from "lucide-react";
import GlassLogoGlow from "../../../../components/memberApp/GlassLogoGlow";
import { Button } from "../../../../components/ui/Button";
import SuccessBadge from "../../../../components/common/SuccessBadge";
import KycStatusBadge from "../../../../components/memberApp/KycStatusBadge";
import PageLoadingState from "../../../../components/memberApp/PageLoadingState";
import {
  useKycSummary,
  useStartKycAttempt,
  useRefreshKycToken,
  useConfirmKycSubmission,
} from "../../../../hooks/useKyc";
import { loadSmileScript } from "../../../../utils/smileScript";
import {
  ID_TYPE_OPTIONS,
  idTypeLabel,
  kycStatusLabel,
  isKycApproved,
  isKycPending,
  isKycInReview,
  isKycNotStarted,
} from "../../../../utils/kycStatus";
import { notifyError, getErrorMessage } from "../../../../utils/errorHandler";

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

// Smile ID capture uses a short-lived token minted by Glass. The callback URL
// is already embedded in the token — do not pass it to the SDK. Keep the
// token in memory only (this component's state / mutation result).
export default function VerifyIdentity() {
  const navigate = useNavigate();
  const { data: summary, isLoading, isError, error, refetch, isFetching } = useKycSummary();
  const startAttempt = useStartKycAttempt();
  const refreshToken = useRefreshKycToken();
  const confirmSubmission = useConfirmKycSubmission();

  const [idType, setIdType] = useState("BVN");
  const [localError, setLocalError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const status = summary?.status ?? "NOT_STARTED";
  const canStart = Boolean(summary?.canStart);
  const canRefreshToken = Boolean(summary?.canRefreshToken);
  const attemptsAllowed = summary?.attemptsAllowed !== false;
  const activeAttemptId = summary?.attemptId ?? null;

  async function runSmileCapture({ attemptId, token }) {
    setLocalError("");
    setCapturing(true);
    try {
      await loadSmileScript();
      if (typeof window.SmileIdentity !== "function") {
        throw new Error("Smile ID SDK failed to load. Please try again.");
      }

      const env = (import.meta.env.VITE_SMILE_ENV ?? "sandbox").toLowerCase();
      const partnerId = import.meta.env.VITE_SMILE_PARTNER_ID ?? "";
      const partnerName = import.meta.env.VITE_SMILE_PARTNER_NAME ?? "Glass";
      const logoUrl = import.meta.env.VITE_SMILE_LOGO_URL ?? "";
      const policyUrl =
        import.meta.env.VITE_SMILE_POLICY_URL ??
        `${import.meta.env.VITE_APP_URL ?? ""}/legal/privacy-policy`;
      const themeColor = import.meta.env.VITE_SMILE_THEME_COLOR ?? "#002FA7";

      let settled = false;
      const finish = async (ok, message) => {
        if (settled) return;
        settled = true;
        if (!ok) {
          setCapturing(false);
          if (message) setLocalError(message);
          return;
        }
        try {
          await confirmSubmission.mutateAsync(attemptId);
          setConfirmed(true);
        } catch (err) {
          setLocalError(
            getErrorMessage(err, "Submitted, but we couldn't update your status. Refresh below."),
          );
        } finally {
          setCapturing(false);
        }
      };

      window.SmileIdentity({
        token,
        product: "biometric_kyc",
        environment: env === "production" ? "production" : "sandbox",
        partner_details: {
          partner_id: partnerId,
          name: partnerName,
          logo_url: logoUrl,
          policy_url: policyUrl,
          theme_color: themeColor,
        },
        onSuccess: () => finish(true),
        onError: (err) =>
          finish(false, typeof err === "string" ? err : "Verification was not completed."),
        onClose: () => finish(false, "Verification cancelled. You can try again."),
      });
    } catch (err) {
      setCapturing(false);
      setLocalError(
        notifyError(err, {
          context: "Start verification",
          fallback: "Couldn't start Smile ID. Please try again.",
        }),
      );
    }
  }

  async function handleStart() {
    setLocalError("");
    try {
      const session = await startAttempt.mutateAsync(idType);
      if (!session?.attemptId || !session?.token) {
        setLocalError("Verification session was incomplete. Please try again.");
        refetch();
        return;
      }
      await runSmileCapture(session);
    } catch (err) {
      setLocalError(
        notifyError(err, {
          context: "Start verification",
          fallback: "Couldn't start verification. Please try again.",
        }),
      );
      refetch();
    }
  }

  async function handleResume() {
    setLocalError("");
    // Resume is only reachable when the button is shown (PENDING + attempt +
    // canRefreshToken). Always mint a fresh capture token — never resume on a
    // stale one, and never treat "PENDING but cannot refresh" as a session
    // expiry path.
    if (!activeAttemptId || !canRefreshToken) return;
    try {
      const session = await refreshToken.mutateAsync(activeAttemptId);
      const token = session?.token;
      if (!token) {
        setLocalError("Couldn't refresh your verification session. Check status and try again.");
        refetch();
        return;
      }
      await runSmileCapture({ attemptId: activeAttemptId, token });
    } catch (err) {
      setLocalError(
        notifyError(err, {
          context: "Resume verification",
          fallback: "Couldn't resume verification. Please try again.",
        }),
      );
      refetch();
    }
  }

  async function handleRefreshStatus() {
    setLocalError("");
    setConfirmed(false);
    try {
      await refetch();
    } catch (err) {
      setLocalError(getErrorMessage(err, "Couldn't refresh status."));
    }
  }

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

  const isApproved = isKycApproved(status);
  const isInReview = isKycInReview(status);
  const isPending = isKycPending(status);
  const isNotStarted = isKycNotStarted(status);
  const canRetry = isNotStarted || (canStart && !isApproved && !isPending && !isInReview);
  const showResume = isPending && activeAttemptId && canRefreshToken;

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
            <Button onClick={handleResume} loading={capturing || refreshToken.isPending}>
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

            <Button
              className="mt-4"
              onClick={handleStart}
              loading={capturing || startAttempt.isPending}
            >
              {capturing
                ? "Opening Smile ID…"
                : startAttempt.isPending
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
