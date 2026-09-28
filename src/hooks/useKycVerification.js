import { useState } from "react";
import {
  useKycSummary,
  useStartKycAttempt,
  useRefreshKycToken,
  useConfirmKycSubmission,
} from "./useKyc";
import { loadSmileScript } from "../utils/smileScript";
import { buildSmileConfig, validateSmileConfig } from "../utils/smileSdkConfig";
import { DEFAULT_SMILE_CALLBACK_URL } from "../api/kyc";
import { isKycApproved, isKycPending, isKycInReview, isKycNotStarted } from "../utils/kycStatus";
import { notifyError, getErrorMessage } from "../utils/errorHandler";

// Shared Smile ID verification flow for every verify-identity surface — the
// member app page and the dashboard page run the exact same state machine,
// only the chrome differs.
//
// Smile ID capture uses a short-lived token minted by Glass, kept in memory
// only (this hook's state / mutation result).
//
// The SDK REQUIRES an explicit `callback_url` on its initialisation call. It
// does NOT read a callback out of that token: omitting the attribute makes
// SmileIdentity throw synchronously, before any document or camera capture
// starts, and every resume retries the same dead end.
//
// The partner configuration the SDK also requires lives in build-time env
// (see .env.example), so it is assembled and checked in one place —
// utils/smileSdkConfig.js — before the call, rather than being discovered one
// provider error at a time in production.
export function useKycVerification() {
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

      // Throws before the SDK is called when a required option is absent, so a
      // misconfigured deploy names every missing key in one message instead of
      // stalling the member on the next provider validation error.
      const config = validateSmileConfig(
        buildSmileConfig({ token, callbackUrl: DEFAULT_SMILE_CALLBACK_URL }),
      );

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
        ...config,
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

  const isApproved = isKycApproved(status);
  const isInReview = isKycInReview(status);
  const isPending = isKycPending(status);
  const isNotStarted = isKycNotStarted(status);
  const canRetry = isNotStarted || (canStart && !isApproved && !isPending && !isInReview);
  const showResume = isPending && activeAttemptId && canRefreshToken;

  return {
    summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    status,
    canStart,
    canRefreshToken,
    attemptsAllowed,
    activeAttemptId,
    idType,
    setIdType,
    localError,
    capturing,
    confirmed,
    handleStart,
    handleResume,
    handleRefreshStatus,
    isApproved,
    isInReview,
    isPending,
    isNotStarted,
    canRetry,
    showResume,
    startPending: startAttempt.isPending,
    resumePending: refreshToken.isPending,
  };
}
