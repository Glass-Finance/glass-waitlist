import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Check, X, Loader2, Clock } from "lucide-react";
import { verifyPayment } from "../../api/members";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

function isTerminal(status) {
  const s = (status ?? "").toUpperCase();
  return s === "SUCCESS" || s === "FAILED";
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const [returnTo] = useState(() => {
    const v = sessionStorage.getItem("paymentReturnTo");
    if (v) sessionStorage.removeItem("paymentReturnTo");
    return v ?? null;
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
    if (paymentId) {
      queryClient.invalidateQueries({ queryKey: ["obligation", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["payment-link", paymentId] });
    }
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
          const finalState = status.toUpperCase() === "SUCCESS" ? "success" : "failed";
          invalidateCaches();
          if (finalState === "success") setAutoRedirectIn(4);
          setState(finalState);
          return;
        }
      } catch {
        // fall through to retry
      }

      attemptsRef.current += 1;
      if (cancelled) return;

      if (attemptsRef.current >= MAX_POLLS) {
        invalidateCaches();
        setState(wasQueuedRef.current ? "processing" : "unknown");
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
  }, [reference]);

  // Auto-redirect after confirmed success
  useEffect(() => {
    if (autoRedirectIn === null) return;
    if (autoRedirectIn <= 0) {
      navigate(returnTo ?? "/member/home");
      return;
    }
    const t = setTimeout(() => setAutoRedirectIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [autoRedirectIn, navigate, returnTo]);

  const dest = returnTo ?? "/member/home";
  const backLabel = returnTo ? "Back to Dashboard" : "Go to Home";

  const content = {
    checking: {
      icon: <Loader2 size={44} className="text-white animate-spin" strokeWidth={2.5} />,
      bg: "#111111",
      text: "Confirming payment…",
      sub: null,
      action: null,
    },
    success: {
      icon: <Check size={44} color="white" strokeWidth={2.5} />,
      bg: "#111111",
      text: "Payment Successful",
      sub: autoRedirectIn != null ? `Redirecting in ${autoRedirectIn}s…` : null,
      action: { label: backLabel, to: dest },
    },
    failed: {
      icon: <X size={44} color="white" strokeWidth={2.5} />,
      bg: "#DC2626",
      text: "Payment Failed",
      sub: null,
      action: {
        label: returnTo ? "Back to Dashboard" : "Try again",
        to: returnTo ?? (paymentId ? `/member/pay/${paymentId}` : "/member/upcoming"),
      },
    },
    processing: {
      icon: <Clock size={44} color="white" strokeWidth={2} />,
      bg: "#1C2B8A",
      text: "Payment Processing",
      sub: "Your payment went through — confirmation is taking a moment. You'll get a notification when it's ready.",
      action: { label: backLabel, to: dest },
    },
    unknown: {
      icon: <Loader2 size={44} className="text-white" strokeWidth={2.5} />,
      bg: "#6B7280",
      text: "Still confirming…",
      sub: "Check your Transactions tab in a moment.",
      action: { label: backLabel, to: dest },
    },
  }[state];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: "#E8E8E8",
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center px-4 pt-10 pb-4 relative">
        <button
          onClick={() => navigate(dest)}
          className="w-9 h-9 rounded-full bg-[#D4D4D4] flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-medium text-gray-800">
          Payment Summary
        </h1>
      </div>

      {/* Status */}
      <div className="flex-1 flex flex-col items-center mt-10 gap-4 px-8">
        <div
          className="w-[100px] h-[100px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: content.bg }}
        >
          {content.icon}
        </div>

        <p className="text-[15px] font-medium text-gray-800 mt-1 text-center">
          {content.text}
        </p>

        {content.sub && (
          <p className="text-[13px] text-gray-500 text-center leading-snug -mt-2">
            {content.sub}
          </p>
        )}

        {content.action && (
          <button
            onClick={() => navigate(content.action.to)}
            className="text-sm font-semibold mt-2 cursor-pointer"
            style={{ color: "#002FA7" }}
          >
            {content.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
