import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, ArrowLeft, Clock } from "lucide-react";
import { verifyPayment } from "../../api/members";
import { settleLocalPaymentForReference } from "../../hooks/usePayments";
import { useAuth } from "../../store/AuthContext";

// The backend's verify endpoint is async: it queues a verification job and
// returns the current DB status (often still "INITIATED"). The job updates the
// record later. We poll for up to ~60s and track whether the backend ever
// returned verificationQueued=true — if it did, the money moved even if we
// never see the terminal status written back in time.
const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 20;

function isTerminal(status) {
  const s = (status ?? "").toUpperCase();
  return s === "SUCCESS" || s === "SUCCESSFUL" || s === "FAILED";
}

export default function PaymentCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const { isAdmin } = useAuth();

  // Read (but don't consume yet) the return destination. paymentReturnTo and
  // paymentPendingRef are only cleared once verification reaches a terminal
  // state — if the session expired mid-payment, they must survive the trip
  // through sign-in so the dashboard can auto-confirm the payment afterwards.
  const [returnTo] = useState(
    () => sessionStorage.getItem("paymentReturnTo") ?? null,
  );

  // Derive the effective destination once auth is resolved. Admin payments
  // always set paymentReturnTo before redirecting to Paystack, so null here
  // means the payment came from the member app.
  const effectiveReturnTo = returnTo ?? (isAdmin ? "/dashboard/admin" : "/member/home");

  // "checking" | "success" | "failed" | "processing" | "unknown"
  const [state, setState] = useState(reference ? "checking" : "unknown");
  const [autoRedirectIn, setAutoRedirectIn] = useState(null);
  const attemptsRef = useRef(0);
  const wasQueuedRef = useRef(false);

  function invalidateCaches() {
    queryClient.invalidateQueries({ queryKey: ["obligations"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["payment-links"] });
    queryClient.invalidateQueries({ queryKey: ["authorisations"] });
    queryClient.invalidateQueries({ queryKey: ["community"] });
  }

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;

    // Terminal states own the cleanup of the pending-payment flags; anything
    // earlier (including a session-expiry bounce) must leave them intact so
    // the dashboard's pending-ref check can finish the job after sign-in.
    function consumePendingFlags() {
      sessionStorage.removeItem("paymentReturnTo");
      sessionStorage.removeItem("paymentPendingRef");
    }

    async function poll() {
      try {
        const res = await verifyPayment(reference, { _skipAuthRedirect: true });
        const data = res.data?.data ?? {};
        const { status, verificationQueued } = data;

        if (verificationQueued) wasQueuedRef.current = true;

        if (cancelled) return;

        if (isTerminal(status)) {
          const s = status.toUpperCase();
          const finalState = (s === "SUCCESS" || s === "SUCCESSFUL") ? "success" : "failed";
          invalidateCaches();
          consumePendingFlags();
          if (finalState === "success") {
            settleLocalPaymentForReference(reference);
            setAutoRedirectIn(5);
          }
          setState(finalState);
          return;
        }
      } catch (err) {
        // Session died while the payer was on Paystack's page — show a
        // sign-in prompt instead of silently retrying into a hard redirect.
        // The pending flags stay put so the payment auto-confirms after
        // re-login.
        if (err?.response?.status === 401 && !cancelled) {
          setState("signin");
          return;
        }
        // Other network / 4xx — count as attempt and retry
      }

      attemptsRef.current += 1;
      if (cancelled) return;

      if (attemptsRef.current >= MAX_POLLS) {
        // Timed out. If the backend queued verification at any point, the charge
        // went through — the status write is just slow. Invalidate so the user
        // sees fresh data when they navigate back.
        invalidateCaches();
        consumePendingFlags();
        setState(wasQueuedRef.current ? "processing" : "unknown");
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
  }, [reference]);

  // Auto-redirect countdown after confirmed success
  useEffect(() => {
    if (autoRedirectIn === null) return;
    if (autoRedirectIn <= 0) { navigate(effectiveReturnTo, { replace: true }); return; }
    const t = setTimeout(() => setAutoRedirectIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [autoRedirectIn, navigate, effectiveReturnTo]);

  const backLabel = isAdmin ? "Back to Dashboard" : "Go to Home";

  const config = {
    checking: {
      icon: <Loader2 size={40} className="animate-spin" style={{ color: "#002FA7" }} />,
      iconBg: "#EEF2FF",
      title: "Confirming payment…",
      subtitle: "Please wait while we verify your transaction.",
      buttonLabel: null,
    },
    success: {
      icon: <Check size={40} strokeWidth={2.5} color="#fff" />,
      iconBg: "#16A34A",
      title: "Payment Successful",
      subtitle: autoRedirectIn != null
        ? `Redirecting you in ${autoRedirectIn}s…`
        : "Your payment has been confirmed.",
      buttonLabel: backLabel,
    },
    failed: {
      icon: <X size={40} strokeWidth={2.5} color="#fff" />,
      iconBg: "#DC2626",
      title: "Payment Failed",
      subtitle: "Something went wrong with this payment. Please try again.",
      buttonLabel: backLabel,
    },
    processing: {
      icon: <Clock size={40} style={{ color: "#002FA7" }} />,
      iconBg: "#EEF2FF",
      title: "Payment Processing",
      subtitle: "Your payment went through but status confirmation is taking a moment. You'll receive a notification when it's ready — usually within a few minutes.",
      buttonLabel: backLabel,
    },
    unknown: {
      icon: <Loader2 size={40} strokeWidth={2} style={{ color: "#6B7280" }} />,
      iconBg: "#F3F4F6",
      title: "Still confirming…",
      subtitle: "We couldn't confirm the outcome yet. Check your Transactions tab in a moment.",
      buttonLabel: backLabel,
    },
    signin: {
      icon: <Clock size={40} style={{ color: "#002FA7" }} />,
      iconBg: "#EEF2FF",
      title: "Sign in to see your payment",
      subtitle:
        "Your session expired while you were completing the payment. Sign back in — your payment will be confirmed on your dashboard automatically.",
      buttonLabel: "Sign in to continue",
    },
  }[state];

  // The signin state's button goes to the sign-in page (admin or member,
  // based on where the payment started) instead of the usual back-target.
  const signInDest = returnTo?.startsWith("/dashboard")
    ? "/sign-in"
    : "/member/app-sign-in";
  const buttonDest = state === "signin" ? signInDest : effectiveReturnTo;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F4F6FA", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center px-4 md:px-8 pt-6 md:pt-8 pb-4">
        <button
          onClick={() => {
            // Leaving voluntarily — the return target is used up, but the
            // pending reference stays so the destination page can still
            // confirm the payment in the background.
            sessionStorage.removeItem("paymentReturnTo");
            navigate(effectiveReturnTo, { replace: true });
          }}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div
          className="w-full bg-white rounded-2xl shadow-sm flex flex-col items-center px-6 md:px-10 py-10 md:py-14 text-center"
          style={{ maxWidth: 480 }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 flex-shrink-0"
            style={{ background: config.iconBg }}
          >
            {config.icon}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">{config.subtitle}</p>

          {reference && state !== "checking" && (
            <p className="text-xs text-gray-400 mt-1 mb-6 font-mono break-all">
              Ref: {reference}
            </p>
          )}

          {config.buttonLabel && (
            <button
              onClick={() => navigate(buttonDest, { replace: true })}
              className="mt-4 px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: "#002FA7" }}
            >
              {config.buttonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
