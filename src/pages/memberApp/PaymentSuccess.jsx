import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Check, X, Loader2, Clock, Share2 } from "lucide-react";
import { verifyPayment } from "../../api/members";
import { settleLocalPaymentForReference } from "../../hooks/usePayments";
import { useTransactionDetail } from "../../hooks/useTransactionDetail";
import { useAuth } from "../../store/AuthContext";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import ReceiptModal from "../../components/common/ReceiptModal";
import { formatNaira, toTitleCase } from "../../utils/format";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 20;

function isTerminal(status) {
  const s = (status ?? "").toUpperCase();
  return s === "SUCCESS" || s === "SUCCESSFUL" || s === "FAILED";
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
  const [shareOpen, setShareOpen] = useState(false);
  const attemptsRef = useRef(0);
  const wasQueuedRef = useRef(false);

  // Only fetched once verification lands on success -- feeds the "for
  // <plan>" subtext and the Share Receipt button, both of which need real
  // transaction data (amount/plan/community) that this page never fetched
  // before. getTransaction() accepts either an id or a reference.
  const { data: tx } = useTransactionDetail(state === "success" ? reference : null);
  const payerName = toTitleCase(
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "",
  );

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
          const s = status.toUpperCase();
          const finalState = (s === "SUCCESS" || s === "SUCCESSFUL") ? "success" : "failed";
          invalidateCaches();
          // Verification is complete — only now is the pending ref used up.
          // Clearing it earlier would break the post-sign-in recovery path
          // if this page never reached a terminal state.
          sessionStorage.removeItem("paymentPendingRef");
          if (finalState === "success") {
            settleLocalPaymentForReference(reference);
          }
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
        sessionStorage.removeItem("paymentPendingRef");
        setState(wasQueuedRef.current ? "processing" : "unknown");
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { cancelled = true; };
  }, [reference]);

  const dest = returnTo ?? "/member/home";
  const backLabel = returnTo ? "Back to Dashboard" : "Go to Home";

  // Mirrors the dashboard PaymentCallback design language: soft-tinted
  // circle + brand spinner while confirming, solid green on success.
  const content = {
    checking: {
      icon: <Loader2 size={40} className="animate-spin" style={{ color: "#002FA7" }} />,
      bg: "#EEF2FF",
      text: "Confirming payment…",
      sub: "Please wait while we verify your transaction.",
      action: null,
    },
    success: {
      icon: <Check size={40} color="white" strokeWidth={2.5} />,
      bg: "#16A34A",
      text: "Transaction Successful",
      sub: tx ? (
        <>
          Your Payment of <strong className="text-gray-700">{formatNaira(tx.amount, { decimals: 2 })}</strong> for{" "}
          <strong className="text-gray-700">{toTitleCase(tx.planName ?? tx.description)}</strong> was successful.
        </>
      ) : (
        "Your payment has been confirmed."
      ),
      action: { label: backLabel, to: dest },
    },
    failed: {
      icon: <X size={40} color="white" strokeWidth={2.5} />,
      bg: "#DC2626",
      text: "Payment Failed",
      sub: "Something went wrong with this payment. Please try again.",
      action: {
        label: returnTo ? "Back to Dashboard" : "Try again",
        to: returnTo ?? (paymentId ? `/member/pay/${paymentId}` : "/member/upcoming"),
      },
    },
    processing: {
      icon: <Clock size={40} style={{ color: "#002FA7" }} />,
      bg: "#EEF2FF",
      text: "Payment Processing",
      sub: "Your payment went through — confirmation is taking a moment. You'll get a notification when it's ready.",
      action: { label: backLabel, to: dest },
    },
    unknown: {
      icon: <Loader2 size={40} style={{ color: "#6B7280" }} />,
      bg: "var(--color-stacked-container)",
      text: "Still confirming…",
      sub: "Check your Transactions tab in a moment.",
      action: { label: backLabel, to: dest },
    },
  }[state];

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{
        background: "var(--color-surface-bg)",
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <GlassLogoGlow />
      {/* Top bar — the success screen is a deliberate landing page (two
          real choices below, no auto-redirect), not an in-flow step, so it
          drops the back/title bar the other states still use. */}
      {state !== "success" && (
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
      )}

      {/* Status */}
      <div
        className={`flex-1 flex flex-col items-center px-8 ${
          state === "success" ? "pt-16 gap-3" : "mt-10 gap-4"
        }`}
      >
        {state === "success" ? (
          <div className="w-[110px] h-[110px] rounded-full bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#16A34A] flex items-center justify-center">
              <Check size={28} color="white" strokeWidth={3} />
            </div>
          </div>
        ) : (
          <div
            className="w-[100px] h-[100px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: content.bg }}
          >
            {content.icon}
          </div>
        )}

        <p
          className={
            state === "success"
              ? "text-xl font-semibold text-gray-900 mt-1 text-center"
              : "text-[15px] font-medium text-gray-800 mt-1 text-center"
          }
        >
          {content.text}
        </p>

        {content.sub && (
          <p className="text-[13px] text-gray-500 text-center leading-snug -mt-1 max-w-[280px]">
            {content.sub}
          </p>
        )}

        {state === "success" ? (
          <div className="flex-1 w-full flex flex-col justify-end gap-3 pb-10 max-w-[340px]">
            <button
              onClick={() => navigate(dest, { replace: true })}
              className="w-full px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer border-none"
              style={{ background: "#002FA7" }}
            >
              Back to Home
            </button>
            <button
              onClick={() => setShareOpen(true)}
              disabled={!tx}
              className="w-full px-8 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 bg-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: "#002FA7", border: "1.5px solid #002FA7" }}
            >
              <Share2 size={15} />
              Share Receipt
            </button>
          </div>
        ) : (
          content.action && (
            <button
              onClick={() => navigate(content.action.to, { replace: true })}
              className="mt-3 px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer border-none"
              style={{ background: "#002FA7" }}
            >
              {content.action.label}
            </button>
          )
        )}
      </div>

      {shareOpen && tx && (
        <ReceiptModal
          tx={tx}
          payerName={payerName}
          payerEmail={user?.email}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
