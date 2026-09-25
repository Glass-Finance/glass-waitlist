import { useEffect, useState } from "react";
import { useKycVerification } from "../../hooks/useKycVerification";
import { isKycApproved, isKycInFlight, isKycTerminal } from "../../utils/kycStatus";
import { getErrorMessage } from "../../utils/errorHandler";
import { Button } from "../ui/Button";
import LoadingState from "../common/LoadingState";
import KycStepper from "./KycStepper";
import IntroStep from "./steps/IntroStep";
import IdTypeStep from "./steps/IdTypeStep";
import CapturePrepStep from "./steps/CapturePrepStep";
import StatusStep from "./steps/StatusStep";

// Step machine + node builders for the KYC verification flow. One hook
// feeds two surfaces: KycWizardModal (portal, fixed header/footer) and the
// two /verify-identity pages (inline chrome) — so the modal and the pages
// can never drift apart again. UI-local state only; useKycVerification
// stays the untouched Smile ID state machine.
//
// Polling: status normally refreshes on focus/after mutations, but while
// this flow is parked on a non-terminal status we also refetch gently
// (bounded — after MAX_POLLS we settle into a "we'll notify you" card
// instead of spinning forever). That bound is what keeps the live
// narrative honest without becoming a background poller.
const POLL_MS = 6000;
const MAX_POLLS = 20; // ~2 minutes

export default function useKycFlow({ reason, onDismiss, onHistory } = {}) {
  const kyc = useKycVerification();
  const {
    summary,
    isLoading,
    isError,
    error,
    refetch,
    status,
    canStart,
    attemptsAllowed,
    isApproved,
    isInReview,
    showResume,
    confirmed,
    capturing,
    startPending,
  } = kyc;

  // null until the summary lands (default step depends on server status).
  const [step, setStep] = useState(null);
  // Poll tally; `settled` is derived from it (see below) rather than
  // tracked separately, so the counting lives in plain state with no refs
  // (react-hooks/refs) and no setState-in-effect.
  const [polls, setPolls] = useState(0);

  // Smart initial step: fresh/retryable accounts get the payoff intro;
  // anything already in motion lands directly on the status step.
  useEffect(() => {
    if (step !== null || isLoading || !summary) return;
    const pick = () => {
      if (
        isKycApproved(status) ||
        isInReview ||
        showResume ||
        isKycInFlight(status) ||
        isKycTerminal(status) ||
        !canStart
      ) {
        return "status";
      }
      return "overview";
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(pick());
  }, [step, isLoading, summary, status, isInReview, showResume, canStart]);

  // Smile ID handed back an error (cancelled/closed/failed start) while we
  // optimistically jumped to the status step — walk back to capture prep so
  // the error and a retry live where the user can act on them. Never fires
  // mid-capture, after a successful submit, or for an in-flight/resumable
  // attempt.
  useEffect(() => {
    if (step !== "status") return;
    if (!kyc.localError || capturing || startPending || confirmed) return;
    if (kyc.isPending || isInReview || showResume) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep("capture");
  }, [
    step,
    kyc.localError,
    capturing,
    startPending,
    confirmed,
    kyc.isPending,
    isInReview,
    showResume,
  ]);

  const terminal = isKycTerminal(status);
  const inFlight = isKycInFlight(status);
  const busy = startPending || capturing;
  // Bounded polling: after MAX_POLLS gentle refetches (~2 minutes) we stop
  // cycling the narrative and settle into a "we'll notify you" card.
  const settled = polls > MAX_POLLS;
  // Mirrors StatusStep's narrativeActive — the footer must agree with the
  // body about whether work is still happening.
  const narrativeLive =
    busy || (confirmed && kyc.isPending) || (!confirmed && !showResume && inFlight && !settled);

  const needsPoll =
    step === "status" &&
    !capturing &&
    !startPending &&
    !settled &&
    inFlight &&
    !isKycApproved(status);

  useEffect(() => {
    if (!needsPoll) return undefined;
    const id = setInterval(() => {
      setPolls((p) => p + 1);
      refetch();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [needsPoll, refetch]);

  function startFlow() {
    setPolls(0);
    setStep("status");
    kyc.handleStart();
  }

  function resumeFlow() {
    setPolls(0);
    kyc.handleResume();
  }

  // ── Footer builders (one primary + one secondary, never scrolled) ─────────
  const secondary = (label, onClick) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className="text-[13px] font-medium text-[#6B7280] bg-transparent border-none cursor-pointer px-1 py-2 hover:text-[#111]"
    >
      {label}
    </button>
  );
  const primary = (label, onClick, { loading = false, disabled = false } = {}) => (
    <Button
      fullWidth={false}
      size="sm"
      className="flex-1 min-w-[150px]"
      onClick={onClick}
      loading={loading}
      disabled={disabled}
    >
      {label}
    </Button>
  );
  const row = (sec, pri) => (
    <div className="flex items-center gap-3 w-full">
      {sec}
      {pri}
    </div>
  );

  // ── Footer (one primary + one secondary, fixed — never scrolled away) ─────
  // Built inline during render (not via a helper that could transitively
  // touch refs): startFlow/resumeFlow only touch the poll ref when invoked
  // as event handlers later.
  let footerNode = null;
  if (step !== null && !isLoading && !(isError && !summary)) {
    if (step === "overview") {
      footerNode = row(
        onDismiss ? secondary("Not now", onDismiss) : null,
        primary("Get started", () => setStep("id-type")),
      );
    } else if (step === "id-type") {
      footerNode = row(
        secondary("Back", () => setStep("overview")),
        primary("Continue", () => setStep("capture")),
      );
    } else if (step === "capture") {
      footerNode = row(
        secondary("Back", () => setStep("id-type")),
        primary(startPending ? "Starting…" : "Open secure capture", startFlow, {
          loading: startPending,
        }),
      );
    } else if (busy) {
      footerNode = row(
        null,
        primary(capturing ? "Waiting for Smile ID…" : "Starting…", undefined, {
          loading: true,
          disabled: true,
        }),
      );
    } else if (isApproved || !attemptsAllowed) {
      footerNode = row(
        null,
        primary("Done", () => onDismiss?.()),
      );
    } else if (showResume && !confirmed && !narrativeLive) {
      footerNode = row(
        onDismiss ? secondary("Done", onDismiss) : null,
        primary(kyc.resumePending ? "Starting…" : "Continue verification", resumeFlow, {
          loading: kyc.resumePending,
        }),
      );
    } else if (terminal) {
      footerNode = row(
        onDismiss ? secondary("Done", onDismiss) : null,
        primary("Try again", () => setStep("id-type")),
      );
    } else {
      footerNode = row(
        onDismiss ? secondary("Done", onDismiss) : null,
        primary("Done", () => onDismiss?.()),
      );
    }
  }

  // ── Body builders ─────────────────────────────────────────────────────────
  let stepper = null;
  let body;

  if (isLoading) {
    body = <LoadingState label="Loading your verification status…" className="py-8" />;
  } else if (isError && !summary) {
    body = (
      <div className="rounded-2xl border border-surface-container-border bg-white p-4">
        <p className="text-sm text-danger m-0">
          {getErrorMessage(error, "Couldn't load your verification status.")}
        </p>
        <Button className="mt-4" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  } else if (step !== null) {
    stepper = <KycStepper current={step} />;
    body = (
      <>
        {step === "overview" && <IntroStep reason={reason} />}
        {step === "id-type" && (
          <IdTypeStep idType={kyc.idType} setIdType={kyc.setIdType} disabled={busy} />
        )}
        {step === "capture" && <CapturePrepStep idType={kyc.idType} />}
        {step === "status" && (
          <StatusStep
            kyc={kyc}
            settled={settled}
            onRetry={() => setStep("id-type")}
            onHistory={onHistory}
          />
        )}
      </>
    );
  } else {
    body = null;
  }

  return {
    kyc,
    step,
    setStep,
    settled,
    closeDisabled: busy,
    busy,
    stepper,
    body,
    footer: footerNode,
  };
}
