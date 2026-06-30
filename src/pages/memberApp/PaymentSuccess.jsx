import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, X, Loader2 } from "lucide-react";
import { verifyPayment } from "../../api/members";

// Paystack's redirect (and the immediate-charge path in PaymentSummary.jsx)
// both attach ?reference= — that's the only way to know what actually
// happened. /payments/callback/verify can return a non-terminal status
// (verificationQueued: true) right after redirect since the gateway's own
// webhook hasn't landed yet, so this polls briefly instead of trusting the
// first response.
const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 5;

function isTerminal(status) {
  const s = (status ?? "").toUpperCase();
  return s === "SUCCESS" || s === "FAILED";
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  // "checking" | "success" | "failed" | "unknown"
  const [state, setState] = useState(reference ? "checking" : "unknown");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await verifyPayment(reference);
        const status = res.data?.data?.status;
        if (cancelled) return;
        if (isTerminal(status)) {
          setState(status.toUpperCase() === "SUCCESS" ? "success" : "failed");
          return;
        }
      } catch {
        // Network/4xx — fall through to retry/give-up logic below rather
        // than asserting success or failure off a request that didn't work.
      }
      attemptsRef.current += 1;
      if (cancelled) return;
      if (attemptsRef.current >= MAX_POLLS) {
        setState("unknown");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const content = {
    checking: {
      icon: <Loader2 size={44} className="text-white animate-spin" strokeWidth={2.5} />,
      bg: "#111111",
      text: "Confirming payment…",
    },
    success: {
      icon: <Check size={44} color="white" strokeWidth={2.5} />,
      bg: "#111111",
      text: "Payment Successful",
    },
    failed: {
      icon: <X size={44} color="white" strokeWidth={2.5} />,
      bg: "#DC2626",
      text: "Payment Failed",
    },
    unknown: {
      icon: <Loader2 size={44} className="text-white" strokeWidth={2.5} />,
      bg: "#6B7280",
      text: "We couldn't confirm this payment yet — check Transactions shortly.",
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
      {/* ── Top bar ── */}
      <div className="flex items-center px-4 pt-10 pb-4 relative">
        <button
          onClick={() => navigate("/member/home")}
          className="w-9 h-9 rounded-full bg-[#D4D4D4] flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-medium text-gray-800">
          Payment Summary
        </h1>
      </div>

      {/* ── Status content — centred vertically ── */}
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

        {state === "failed" && (
          <button
            onClick={() => navigate(`/member/pay/${paymentId}`)}
            className="text-sm font-semibold mt-2 cursor-pointer"
            style={{ color: "#002FA7" }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
