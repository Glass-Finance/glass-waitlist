import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info, X, Landmark, Loader2 } from "lucide-react";
import {
  useInitiatePayment,
  useManagePayments,
  recordLocalPayment,
  stashPendingPaymentCtx,
  findAuthorisationForPlan,
} from "../../../hooks/usePayments";
import { initiatePayment as initiatePaymentApi } from "../../../api/members";
import { getErrorMessage } from "../../../utils/errorHandler";
import { toTitleCase } from "../../../utils/format";
import Toggle from "../../../components/common/Toggle";
import AutoPayPrompt from "../../../components/common/AutoPayPrompt";
import { formatNaira } from "./helpers";

export function AdminPaymentModal({ item, onClose }) {
  const navigate = useNavigate();
  const initiatePayment = useInitiatePayment();
  const { data: authorisations } = useManagePayments();
  const [error, setError] = useState("");
  // Separate from initiatePayment.isPending: the mutation resolves as soon
  // as the API responds with an authorizationUrl, but window.location.href
  // still takes a beat to actually leave the page. Without this, the button
  // flashes back to "Pay" during that gap. (Same fix as PaymentSummary.)
  const [redirecting, setRedirecting] = useState(false);
  // Set only when a direct (no-redirect) charge just succeeded and this
  // plan is eligible for the "Turn on Auto-Pay?" nudge -- swaps the modal
  // body for AutoPayPrompt instead of closing outright. The redirect-based
  // path (Paystack-hosted checkout) can't do this in-place since the page
  // navigates away entirely; that case is handled after the fact by
  // AdminPaymentCallback + DashboardLayout via the stashed pending ctx.
  const [autoPayPrompt, setAutoPayPrompt] = useState(null);

  // No keyboard dismiss for the Auto-Pay prompt, matching Home.jsx's own
  // AutoPayPrompt (backdrop click only) -- Escape here would otherwise
  // close the whole flow without recording that they were asked.
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !autoPayPrompt) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, autoPayPrompt]);

  // Pre-fetch the initiate-payment response as soon as the modal opens so
  // the real billedAmount (amount + platform fee) can be shown before the
  // admin confirms -- same pattern as PaymentSummary.jsx's member checkout.
  // Silent failure -- falls back to item.amount with no fee breakdown.
  const [prefetch, setPrefetch] = useState(null);
  useEffect(() => {
    if (!item.paymentLinkId || prefetch) return;
    let cancelled = false;
    initiatePaymentApi(item.paymentLinkId, {
      idempotencyKey: crypto.randomUUID(),
      amount: item.amount,
      savePaymentMethod: true,
      ...(item.obligationId ? { obligationId: item.obligationId } : {}),
    })
      .then((res) => { if (!cancelled) setPrefetch(res.data?.data ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [item.paymentLinkId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Confirmed with backend: a consent is scoped per recurring plan -- the
  // card saved on a plan's first payment is what auto-charges that plan
  // going forward, so "any ACTIVE authorisation" isn't necessarily the one
  // that will actually be charged here if this admin has other recurring
  // plans on other saved cards. Must match this specific payment link.
  const savedMethod = findAuthorisationForPlan(authorisations, {
    paymentLinkId: item.paymentLinkId,
    title: item.name,
    communityName: item.communityName,
  });
  const isRecurring = item.type === "recurring";
  const communityInitials = (item.communityName ?? "C")
    .slice(0, 2)
    .toUpperCase();
  // Confirmed with backend: savePaymentMethod is optional at the API level
  // for every payment, recurring or not -- forcing it on here (an earlier
  // frontend-only choice) silently enrolled every recurring payer in
  // Auto-Pay with no real way to decline, since the consent is created the
  // instant the payment succeeds and can't be selectively revoked
  // afterward (only by deleting the whole saved card). Defaults to on for
  // a recurring plan since that's the point of Auto-Pay, but it's a real,
  // changeable choice now.
  const [saveMethod, setSaveMethod] = useState(true);
  const effectiveSaveMethod = saveMethod;
  // Same permanent-rejection case as PaymentSummary.jsx's member-side flow --
  // once the backend says the link isn't accepting payments, retrying hits
  // the same wall every time, so the button should stop inviting it.
  const isLinkInactive = /not accepting payments/i.test(error);

  async function handlePay() {
    setError("");
    try {
      // Store current URL so /payment/callback can send the admin back here
      sessionStorage.setItem(
        "paymentReturnTo",
        window.location.pathname + window.location.search,
      );
      const res = await initiatePayment.mutateAsync({
        paymentLinkId: item.paymentLinkId,
        payload: {
          idempotencyKey: crypto.randomUUID(),
          amount: item.amount,
          savePaymentMethod: effectiveSaveMethod,
          ...(item.obligationId ? { obligationId: item.obligationId } : {}),
        },
      });
      const url = res.data?.data?.authorizationUrl;
      const reference = res.data?.data?.reference;
      if (url) {
        setRedirecting(true);
        // Let the callback page pick up this reference for verification even
        // if Paystack sends the admin back without one in the URL, and stash
        // the plan context so the confirmed payment writes the local paid log.
        if (reference) sessionStorage.setItem("paymentPendingRef", reference);
        // Plan context beyond just paymentLinkId/obligationId -- read back by
        // AdminPaymentCallback on the far side of the redirect to decide
        // whether to offer the Auto-Pay prompt once this admin lands back on
        // the dashboard (see PaymentCallback.jsx).
        stashPendingPaymentCtx({
          reference,
          paymentLinkId: item.paymentLinkId,
          obligationId: item.obligationId ?? null,
          isRecurring,
          planName: item.name,
          frequency: item.frequency,
          amount: item.amount,
        });
        window.location.href = url;
      } else {
        // Charged immediately against a saved method — no redirect happened,
        // so record it here for instant Paid status.
        recordLocalPayment({
          paymentLinkId: item.paymentLinkId,
          obligationId: item.obligationId,
        });
        // Offer Auto-Pay only when this specific payment just declined to
        // save a method and the plan still has no consent -- if they *did*
        // save this time, it's already on and asking again would be
        // redundant (savedMethod/hasAutoPayConsent below reflect the
        // pre-payment authorisations list, which wouldn't show a
        // just-created consent yet).
        const justAskedNotTo = isRecurring && item.paymentLinkId && !effectiveSaveMethod && !savedMethod;
        const alreadyAsked = (() => {
          try { return !!localStorage.getItem(`glass_autopay_asked_${item.paymentLinkId}`); }
          catch { return false; }
        })();
        if (justAskedNotTo && !alreadyAsked) {
          setAutoPayPrompt({
            paymentLinkId: item.paymentLinkId,
            planName: item.name,
            amount: item.amount,
            frequency: item.frequency,
          });
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not start payment. Please try again."),
      );
    }
  }

  function dismissAutoPayPrompt() {
    if (autoPayPrompt?.paymentLinkId) {
      try { localStorage.setItem(`glass_autopay_asked_${autoPayPrompt.paymentLinkId}`, "1"); } catch { /* ignore */ }
    }
    setAutoPayPrompt(null);
    onClose();
  }

  function enableAutoPay() {
    dismissAutoPayPrompt();
    navigate("/dashboard/settings/finance/auto-pay");
  }

  if (autoPayPrompt) {
    return (
      <AutoPayPrompt
        prompt={autoPayPrompt}
        onDismiss={dismissAutoPayPrompt}
        onEnable={enableAutoPay}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-surface-container-border max-w-[560px] max-h-[90vh] overflow-y-auto"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5">
          <span className="text-lg font-medium text-gray-900">Transaction Details</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer bg-transparent border-none transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Community + payment method + Auto-Pay toggle ── */}
        <div className="mx-7 rounded-xl bg-stacked-container px-4">
          <div className="flex items-center gap-3 py-4 border-b border-gray-200">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-surface-container-border bg-[#f0f4ff]"
            >
              {item.logo?.url ? (
                <img
                  src={item.logo.url}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-[11px] font-bold text-brand">
                  {communityInitials}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {item.communityName ?? "Community"}
            </span>
          </div>

          {savedMethod ? (
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <Landmark size={16} className="text-brand" />
                <span className="text-sm font-medium text-gray-900">
                  {toTitleCase(savedMethod.cardType ?? savedMethod.bank ?? "Card")} ●●●●{savedMethod.last4}
                  {savedMethod.expMonth && savedMethod.expYear
                    ? ` | ${String(savedMethod.expMonth).padStart(2, "0")}/${String(savedMethod.expYear).slice(-2)}`
                    : ""}
                </span>
              </div>
              <button
                onClick={() => navigate("/dashboard/settings/finance/payment-methods")}
                className="text-[13px] font-semibold bg-transparent border-none cursor-pointer text-brand"
              >
                Change
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-3 border-b border-gray-200">
              You'll select your payment method on the next screen.
            </p>
          )}

          {/* Always shown, saved method or not -- a real, changeable choice
              for every plan (confirmed with backend: savePaymentMethod is
              optional at the API level regardless of plan type). */}
          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              {isRecurring ? "Enable Recurring Payment" : "Save Payment Method"}
              <span
                title={
                  isRecurring
                    ? "Save this card and charge it automatically each cycle. Turn off to pay this cycle only."
                    : "Save this payment method for faster checkout next time."
                }
              >
                <Info size={12} className="text-gray-400" />
              </span>
            </span>
            <Toggle on={saveMethod} onChange={setSaveMethod} />
          </div>
        </div>

        {/* ── Plan details ── */}
        <div className="mx-7 mt-4 mb-6 rounded-xl bg-stacked-container p-4">
          <p className="text-sm font-semibold text-gray-900 mb-4">Plan Details</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="text-sm font-medium text-gray-900">
                {item.name ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Payment Schedule</span>
              <span className="text-[11px] font-semibold px-3 py-0.5 rounded-full bg-[#EEF1FB] text-brand">
                {isRecurring ? toTitleCase((item.frequency ?? "Recurring").toLowerCase()) : "One-Time"}
              </span>
            </div>
            {prefetch?.billedAmount != null && prefetch.billedAmount !== item.amount ? (
              <>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNaira(item.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Charge</span>
                  <span className="text-sm text-gray-600">
                    {formatNaira(prefetch.billedAmount - item.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-[17px] font-bold text-gray-900">
                    {formatNaira(prefetch.billedAmount)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatNaira(item.amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 px-7 pb-4">{error}</p>}

        {/* ── Footer -- single action, matching the X close button for
            "never mind" instead of a redundant second Cancel button. ── */}
        <div className="px-7 pb-6 flex items-center justify-end">
          <button
            onClick={handlePay}
            disabled={initiatePayment.isPending || redirecting || isLinkInactive}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border-none transition-opacity flex items-center gap-2 bg-brand"
          >
            {initiatePayment.isPending || redirecting ? (
              <>
                <Loader2 size={14} className="animate-spin" />{" "}
                {redirecting ? "Opening secure payment…" : "Processing…"}
              </>
            ) : isLinkInactive ? (
              "Payment Unavailable"
            ) : (
              "Make Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
