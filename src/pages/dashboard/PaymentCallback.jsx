import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, ArrowLeft, Clock, Share2 } from "lucide-react";
import { verifyPayment } from "../../api/members";
import { settleLocalPaymentForReference } from "../../hooks/usePayments";
import { useTransactionDetail } from "../../hooks/useTransactionDetail";
import { useAuth } from "../../store/AuthContext";
import ReceiptModal from "../../components/common/ReceiptModal";
import { formatNaira, toTitleCase } from "../../utils/format";

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
  const { isAdmin, user } = useAuth();

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
  const [shareOpen, setShareOpen] = useState(false);
  const attemptsRef = useRef(0);
  const wasQueuedRef = useRef(false);
  // One-time check at mount -- this page isn't resized mid-session in
  // practice (it's a landing screen right after a Paystack redirect), so a
  // resize listener would be unused complexity. Desktop keeps the existing
  // centered-card design and auto-redirect exactly as before; only the
  // mobile success screen gets the new full-bleed layout below.
  const [isMobile] = useState(() => window.innerWidth < 768);

  // Only fetched once verification lands on success, and only matters for
  // the mobile success layout's amount/plan subtext and Share Receipt.
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
            // Desktop keeps the auto-redirect exactly as before. Mobile's
            // new layout gives two deliberate actions (Home / Share
            // Receipt) instead -- auto-navigating away would yank the user
            // off the screen before they could tap either.
            if (!isMobile) setAutoRedirectIn(5);
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
      icon: <Loader2 size={40} className="animate-spin" style={{ color: "var(--color-brand)" }} />,
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
      icon: <Clock size={40} style={{ color: "var(--color-brand)" }} />,
      iconBg: "#EEF2FF",
      title: "Payment Processing",
      subtitle: "Your payment went through but status confirmation is taking a moment. You'll receive a notification when it's ready — usually within a few minutes.",
      buttonLabel: backLabel,
    },
    unknown: {
      icon: <Loader2 size={40} strokeWidth={2} style={{ color: "#6B7280" }} />,
      iconBg: "var(--color-stacked-container)",
      title: "Still confirming…",
      subtitle: "We couldn't confirm the outcome yet. Check your Transactions tab in a moment.",
      buttonLabel: backLabel,
    },
    signin: {
      icon: <Clock size={40} style={{ color: "var(--color-brand)" }} />,
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

  // Mobile's success screen only, per the design -- checking/failed/
  // processing/unknown/signin, and every state on desktop, keep the
  // existing centered-card layout below unchanged.
  if (isMobile && state === "success") {
    return (
      <div
        className="min-h-screen flex flex-col items-center px-8 pt-16"
        style={{ background: "#F4F6FA", fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="w-[110px] h-[110px] rounded-full bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#16A34A] flex items-center justify-center">
            <Check size={28} color="white" strokeWidth={3} />
          </div>
        </div>

        <p className="text-xl font-semibold text-gray-900 mt-3 text-center">
          Transaction Successful
        </p>

        <p className="text-[13px] text-gray-500 text-center leading-snug mt-1 max-w-[280px]">
          {tx ? (
            <>
              Your Payment of <strong className="text-gray-700">{formatNaira(tx.amount, { decimals: 2 })}</strong> for{" "}
              <strong className="text-gray-700">{toTitleCase(tx.planName ?? tx.description)}</strong> was successful.
            </>
          ) : (
            "Your payment has been confirmed."
          )}
        </p>

        <div className="flex-1 w-full flex flex-col justify-end gap-3 pb-10 max-w-[340px]">
          <button
            onClick={() => navigate(effectiveReturnTo, { replace: true })}
            className="w-full px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer border-none"
            style={{ background: "var(--color-brand)" }}
          >
            Back to Home
          </button>
          <button
            onClick={() => setShareOpen(true)}
            disabled={!tx}
            className="w-full px-8 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 bg-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "var(--color-brand)", border: "1.5px solid var(--color-brand)" }}
          >
            <Share2 size={15} />
            Share Receipt
          </button>
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
              style={{ background: "var(--color-brand)" }}
            >
              {config.buttonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
