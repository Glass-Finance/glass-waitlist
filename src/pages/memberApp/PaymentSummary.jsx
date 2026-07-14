import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Landmark, Loader2 } from "lucide-react";
import { getObligation, getPaymentLink, initiatePayment as initiatePaymentApi } from "../../api/members";
import {
  useManagePayments,
  useInitiatePayment,
  recordLocalPayment,
  stashPendingPaymentCtx,
} from "../../hooks/usePayments";
import { getErrorMessage } from "../../utils/errorHandler";
import { toastSuccess } from "../../utils/toast";
import { scheduleCopy, estimateNextCharge } from "../../utils/recurring";
import { toTitleCase, formatNaira as fmt } from "../../utils/format";

function useObligation(obligationId) {
  return useQuery({
    queryKey: ["obligation", obligationId],
    queryFn: async () => {
      const res = await getObligation(obligationId);
      return res.data?.data ?? res.data;
    },
    enabled: !!obligationId,
  });
}

function usePaymentLinkData(linkId) {
  return useQuery({
    queryKey: ["payment-link", linkId],
    queryFn: async () => {
      const res = await getPaymentLink(linkId);
      // GET /payment-links/{id} wraps the link as { paymentLink, obligations }
      const data = res.data?.data;
      return data?.paymentLink ?? data ?? res.data;
    },
    enabled: !!linkId,
  });
}

// Normalize a payment link into the same shape the component renders.
function normalizeLinkToObligation(link) {
  if (!link) return null;
  return {
    id: undefined,
    amount: link.amount,
    community: link.community,
    recurringPlan: link.recurringPlan ?? null,
    paymentLink: {
      id: link.id,
      title: link.title ?? link.name,
    },
  };
}

// ─── Saved-method icon ────────────────────────────────────────────────────────
function MethodIcon() {
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: "#EEF2FF" }}
    >
      <Landmark size={16} className="text-[#1C2B8A]" />
    </div>
  );
}

// ─── Payment Summary screen ───────────────────────────────────────────────────
export default function PaymentSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const viaLink = searchParams.get("via") === "link";
  const [error, setError] = useState("");

  const { data: obligationData, isLoading: obligationLoading, error: obligationError } = useObligation(!viaLink ? paymentId : null);
  const { data: linkRaw, isLoading: linkLoading, error: linkError } = usePaymentLinkData(viaLink ? paymentId : null);

  const obligation = viaLink ? normalizeLinkToObligation(linkRaw) : obligationData;
  const isLoading = viaLink ? linkLoading : obligationLoading;
  // Distinct from `error` (the payment-initiation error below) -- this one
  // means the payment itself couldn't be found/loaded, not that paying it
  // failed. Previously silent: the button would just stay disabled with no
  // indication why, indistinguishable from a slow network.
  const loadError = viaLink ? linkError : obligationError;

  const { data: authorisations } = useManagePayments();
  const initiatePayment = useInitiatePayment();

  // Stable idempotency key for this payment session — same key used for both
  // the pre-fetch and the actual pay button so the backend treats them as one.
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const [prefetch, setPrefetch] = useState(null);
  // Separate from initiatePayment.isPending: the mutation resolves as soon
  // as the API responds with an authorizationUrl, but window.location.href
  // still takes a beat to actually leave the page. Without this, the button
  // flashes back to "Make Payment" during that gap.
  const [redirecting, setRedirecting] = useState(false);

  // Pre-fetch the initiate-payment response as soon as the obligation loads
  // so we can show the real billedAmount (obligation + platform fee) before
  // the member confirms. Silent failure — falls back to obligation.amount.
  useEffect(() => {
    if (!obligation?.paymentLink?.id || prefetch) return;
    let cancelled = false;
    initiatePaymentApi(obligation.paymentLink.id, {
      idempotencyKey: idempotencyKeyRef.current,
      amount: obligation.amount,
      savePaymentMethod: true,
      ...(obligation.id ? { obligationId: obligation.id } : {}),
    })
      .then((res) => { if (!cancelled) setPrefetch(res.data?.data ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [obligation?.paymentLink?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fall back to whatever Home/UpcomingPayments already knew about this
  // community — the fresh obligation/payment-link fetch above isn't
  // guaranteed to carry it back (see handlePay in those two pages).
  const navState = location.state ?? {};
  const communityName = obligation?.community?.name ?? navState.communityName ?? "Community";
  const communityInitials = communityName.slice(0, 2).toUpperCase();
  const communityLogo = obligation?.community?.logo ?? navState.communityLogo;
  const isRecurring = !!obligation?.recurringPlan;
  const savedMethod = authorisations?.find((a) => (a.status ?? "").toUpperCase() === "ACTIVE");
  // Recurring plans always save the method — required for Auto-Pay. For a
  // one-time payment with no method on file yet (a new card is about to be
  // entered on Paystack's page), the member gets a real choice.
  const [saveMethod, setSaveMethod] = useState(true);
  const effectiveSaveMethod = isRecurring ? true : saveMethod;

  async function handlePay() {
    if (!obligation?.paymentLink?.id) return;
    setError("");

    // For direct charges (saved card, no Paystack redirect) the pre-fetched
    // reference is still valid — the charge already went through on the backend.
    if (prefetch?.reference && !prefetch?.authorizationUrl) {
      recordLocalPayment({
        paymentLinkId: obligation.paymentLink.id,
        obligationId: obligation.id,
      });
      toastSuccess("Payment sent", { reference: prefetch.reference });
      navigate(`/member/pay/${paymentId}/success?reference=${prefetch.reference}`, { replace: true });
      return;
    }

    // For Paystack-hosted payments we always generate a fresh authorization
    // URL on button click. The pre-fetched URL is only used to display the
    // billed amount; reusing it for the redirect risks a "could not start
    // this transaction" error from Paystack if the user lingered on this
    // screen and the URL expired.
    try {
      const res = await initiatePayment.mutateAsync({
        paymentLinkId: obligation.paymentLink.id,
        payload: {
          idempotencyKey: idempotencyKeyRef.current,
          amount: obligation.amount,
          savePaymentMethod: effectiveSaveMethod,
          ...(obligation.id ? { obligationId: obligation.id } : {}),
        },
      });
      const url = res.data?.data?.authorizationUrl;
      const reference = res.data?.data?.reference;
      if (url) {
        setRedirecting(true);
        sessionStorage.setItem("paymentReturnTo", "/member/home");
        if (reference) sessionStorage.setItem("paymentPendingRef", reference);
        // Lets whichever page confirms the payment afterwards write the
        // local paid log for this exact plan/obligation.
        stashPendingPaymentCtx({
          reference,
          paymentLinkId: obligation.paymentLink.id,
          obligationId: obligation.id ?? null,
        });
        window.location.href = url;
      } else {
        // No authorizationUrl means this charged immediately against a
        // saved method rather than redirecting to Paystack's hosted page.
        recordLocalPayment({
          paymentLinkId: obligation.paymentLink.id,
          obligationId: obligation.id,
        });
        toastSuccess("Payment sent", { reference });
        navigate(`/member/pay/${paymentId}/success?reference=${reference}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not start payment. Please try again."));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-screen" style={{ background: "#E8E8E8" }}>
        <Loader2 size={22} className="animate-spin text-[#002FA7]" />
        <p className="text-sm text-gray-400">Loading payment details…</p>
      </div>
    );
  }

  if (loadError || !obligation) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-screen px-6 text-center" style={{ background: "#E8E8E8" }}>
        <p className="text-sm text-gray-600">
          {getErrorMessage(loadError, "Couldn't load this payment. It may no longer be available.")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
          style={{ background: "#002FA7" }}
        >
          Go back
        </button>
      </div>
    );
  }

  // Shows when in test/beta mode. Set VITE_TEST_MODE=false in deployment env to hide.
  const isTestMode = import.meta.env.VITE_TEST_MODE !== "false";

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
      <div className="flex items-center px-4 pt-5 pb-4 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm cursor-pointer"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-gray-900">
          Payment Summary
        </h1>
      </div>

      {/* ── Test mode banner ── */}
      {isTestMode && (
        <div
          className="mx-4 mb-3 rounded-xl px-4 py-3"
          style={{ background: "#FFFBEB", border: "1.5px solid #FCD34D" }}
        >
          <p className="text-[12px] font-bold text-amber-800 mb-1.5">🧪 Test Mode — No real money is charged</p>
          <p className="text-[11px] text-amber-700 mb-2">Use the card details below to complete this payment:</p>
          <div className="rounded-lg px-3 py-2.5 flex flex-col gap-1" style={{ background: "#FEF3C7" }}>
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-700">Card number</span>
              <span className="font-mono font-bold text-amber-900 tracking-wide">4084 0840 8408 4081</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-700">Expiry</span>
              <span className="font-mono font-bold text-amber-900">01/99</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-700">CVV</span>
              <span className="font-mono font-bold text-amber-900">408</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-700">PIN</span>
              <span className="font-mono font-bold text-amber-900">0000</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-700">OTP</span>
              <span className="font-mono font-bold text-amber-900">123456</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 pt-2">
        {/* ── Card 1: Community + saved method ── */}
        <div className="bg-[#FFFFFF99] rounded-2xl px-4 py-4">
          {/* Community row */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div
              className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100"
              style={{ background: "#f0f4ff" }}
            >
              {communityLogo?.url ? (
                <img src={communityLogo.url} alt="" decoding="async" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-[#1C2B8A]">{communityInitials}</span>
              )}
            </div>
            <span className="text-[14px] font-medium text-gray-900">{communityName}</span>
          </div>

          <div className="bg-[#FFFFFF66] rounded-xl px-4 py-3">
            {savedMethod ? (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <MethodIcon />
                  <span className="text-[14px] font-medium text-gray-900">
                    {toTitleCase(savedMethod.bank ?? "Bank Account")} ●●●● {savedMethod.last4}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-gray-500 py-1">
                  You'll choose how to pay on the next screen.
                </p>
                {!isRecurring && (
                  <label className="flex items-center gap-2 mt-1 pt-2 border-t border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveMethod}
                      onChange={(e) => setSaveMethod(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#002FA7] cursor-pointer"
                    />
                    <span className="text-[12px] text-gray-500">
                      Save this payment method for faster checkout next time
                    </span>
                  </label>
                )}
              </>
            )}

            {isRecurring && (
              <p className="text-[12px] text-gray-400 mt-2 pt-2 border-t border-gray-200">
                This plan will be saved for Auto-Pay after your first successful payment.
              </p>
            )}
          </div>
        </div>

        {/* ── Card 2: Plan details ── */}
        <div className="bg-[#FFFFFF99] rounded-2xl px-4 py-4">
          <p className="text-[14px] font-normal text-gray-900 mb-4">Plan Details</p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-gray-500">Payment Schedule:</span>
            <span
              className="text-[12px] font-semibold px-3 py-0.5 rounded-full"
              style={{ background: "#EEF1FB", color: "#1C2B8A" }}
            >
              {isRecurring
                ? toTitleCase((obligation?.recurringPlan?.frequency ?? "Recurring").toLowerCase())
                : "One-Time"}
            </span>
          </div>

          {isRecurring && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500">Renews:</span>
              <span className="text-[13px] text-gray-900">
                {scheduleCopy(obligation.recurringPlan)}
              </span>
            </div>
          )}

          {isRecurring && (() => {
            const next = estimateNextCharge(obligation.recurringPlan, obligation?.dueDate);
            if (!next) return null;
            return (
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-gray-500">Next charge (est.):</span>
                <span className="text-[13px] text-gray-900">
                  {next.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            );
          })()}

          <div className="flex items-center justify-between mb-2.5 pb-3 border-b border-gray-100">
            <span className="text-[13px] text-gray-500">Plan:</span>
            <span className="text-[14px] text-gray-900">{toTitleCase(obligation?.paymentLink?.title) ?? "—"}</span>
          </div>

          {prefetch?.billedAmount != null && prefetch.billedAmount !== obligation?.amount ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-gray-500">Amount:</span>
                <span className="text-[14px] text-gray-900">{fmt(obligation?.amount)}</span>
              </div>
              <div className="flex items-center justify-between mb-2.5 pb-3 border-b border-gray-100">
                <span className="text-[13px] text-gray-500">Platform Fee:</span>
                <span className="text-[13px] text-gray-600">{fmt(prefetch.billedAmount - (obligation?.amount ?? 0))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">Total Charged:</span>
                <span className="text-[15px] font-bold text-gray-900">{fmt(prefetch.billedAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">Total:</span>
              <span className="text-[15px] font-bold text-gray-900">{fmt(obligation?.amount)}</span>
            </div>
          )}

          {isRecurring && (
            <p className="text-[12px] text-gray-400 mt-3 pt-3 border-t border-gray-100 leading-relaxed">
              Today you're paying the current cycle. After that,{" "}
              {fmt(obligation?.amount)} renews{" "}
              {scheduleCopy(obligation.recurringPlan).toLowerCase()} until the
              plan ends or you turn off Auto-Pay in Settings.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500 px-1">{error}</p>}

        {/* ── Make Payment button ── */}
        <button
          onClick={handlePay}
          disabled={initiatePayment.isPending || redirecting || !obligation}
          className="w-full rounded-md py-4 text-[15px] font-semibold text-white mt-1 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-80 flex items-center justify-center gap-2"
          style={{ background: "#002FA7" }}
        >
          {initiatePayment.isPending || redirecting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {redirecting ? "Opening secure payment…" : "Processing…"}
            </>
          ) : (
            "Make Payment"
          )}
        </button>
      </div>
    </div>
  );
}
