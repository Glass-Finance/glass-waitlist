import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, ArrowLeft, Clock } from "lucide-react";
import { verifyPayment } from "../../api/members";

// The backend's verify endpoint is async: it queues a verification job and
// returns the current DB status (often still "INITIATED"). The job updates the
// record later. We poll for up to ~60s and track whether the backend ever
// returned verificationQueued=true — if it did, the money moved even if we
// never see the terminal status written back in time.
const POLL_INTERVAL_MS = 3000;
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

  const [returnTo] = useState(() => {
    const v = sessionStorage.getItem("paymentReturnTo");
    if (v) sessionStorage.removeItem("paymentReturnTo");
    return v ?? "/dashboard/admin";
  });

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

    async function poll() {
      try {
        const res = await verifyPayment(reference);
        const data = res.data?.data ?? {};
        const { status, verificationQueued } = data;

        if (verificationQueued) wasQueuedRef.current = true;

        if (cancelled) return;

        if (isTerminal(status)) {
          const s = status.toUpperCase();
          const finalState = (s === "SUCCESS" || s === "SUCCESSFUL") ? "success" : "failed";
          invalidateCaches();
          if (finalState === "success") setAutoRedirectIn(5);
          setState(finalState);
          return;
        }
      } catch {
        // Network / 4xx — count as attempt and retry
      }

      attemptsRef.current += 1;
      if (cancelled) return;

      if (attemptsRef.current >= MAX_POLLS) {
        // Timed out. If the backend queued verification at any point, the charge
        // went through — the status write is just slow. Invalidate so the user
        // sees fresh data when they navigate back.
        invalidateCaches();
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
    if (autoRedirectIn <= 0) { navigate(returnTo); return; }
    const t = setTimeout(() => setAutoRedirectIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [autoRedirectIn, navigate, returnTo]);

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
      buttonLabel: "Back to Dashboard",
    },
    failed: {
      icon: <X size={40} strokeWidth={2.5} color="#fff" />,
      iconBg: "#DC2626",
      title: "Payment Failed",
      subtitle: "Something went wrong with this payment. Please try again from the dashboard.",
      buttonLabel: "Back to Dashboard",
    },
    processing: {
      icon: <Clock size={40} style={{ color: "#002FA7" }} />,
      iconBg: "#EEF2FF",
      title: "Payment Processing",
      subtitle: "Your payment went through but status confirmation is taking a moment. You'll receive a notification when it's ready — usually within a few minutes.",
      buttonLabel: "Back to Dashboard",
    },
    unknown: {
      icon: <Loader2 size={40} strokeWidth={2} style={{ color: "#6B7280" }} />,
      iconBg: "#F3F4F6",
      title: "Still confirming…",
      subtitle: "We couldn't confirm the outcome yet. Check your Transactions tab in a moment.",
      buttonLabel: "Back to Dashboard",
    },
  }[state];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F4F6FA", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center px-8 pt-8 pb-4">
        <button
          onClick={() => navigate(returnTo)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div
          className="w-full bg-white rounded-2xl shadow-sm flex flex-col items-center px-10 py-14 text-center"
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
              onClick={() => navigate(returnTo)}
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
