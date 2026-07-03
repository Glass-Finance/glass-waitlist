import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Landmark } from "lucide-react";
import { getObligation, getPaymentLink } from "../../api/members";
import { useManagePayments, useInitiatePayment } from "../../hooks/usePayments";
import { getErrorMessage } from "../../utils/errorHandler";
import { toastSuccess } from "../../utils/toast";

function fmt(n) {
  return "₦" + new Intl.NumberFormat("en-NG").format(n ?? 0);
}

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
      return res.data?.data ?? res.data;
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
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const viaLink = searchParams.get("via") === "link";
  const [error, setError] = useState("");

  const { data: obligationData, isLoading: obligationLoading } = useObligation(!viaLink ? paymentId : null);
  const { data: linkRaw, isLoading: linkLoading } = usePaymentLinkData(viaLink ? paymentId : null);

  const obligation = viaLink ? normalizeLinkToObligation(linkRaw) : obligationData;
  const isLoading = viaLink ? linkLoading : obligationLoading;

  const { data: authorisations } = useManagePayments();
  const initiatePayment = useInitiatePayment();

  const communityName = obligation?.community?.name ?? "Community";
  const communityInitials = communityName.slice(0, 2).toUpperCase();
  const communityLogo = obligation?.community?.logo;
  const isRecurring = !!obligation?.recurringPlan;
  const savedMethod = authorisations?.find((a) => (a.status ?? "").toUpperCase() === "ACTIVE");

  async function handlePay() {
    if (!obligation?.paymentLink?.id) return;
    setError("");
    try {
      const res = await initiatePayment.mutateAsync({
        paymentLinkId: obligation.paymentLink.id,
        payload: {
          idempotencyKey: crypto.randomUUID(),
          amount: obligation.amount,
          savePaymentMethod: isRecurring,
          ...(obligation.id ? { obligationId: obligation.id } : {}),
        },
      });
      const url = res.data?.data?.authorizationUrl;
      const reference = res.data?.data?.reference;
      if (url) {
        window.location.href = url;
      } else {
        // No authorizationUrl means this charged immediately against a
        // saved method rather than redirecting to Paystack's hosted page —
        // PaymentSuccess still needs the reference to verify the actual
        // outcome, so it travels as a query param same as Paystack's own
        // redirect would carry it.
        toastSuccess("Payment sent", { reference });
        navigate(`/member/pay/${paymentId}/success?reference=${reference}`);
      }
    } catch (err) {
      // No notifyError() here — initiatePayment is a useMutation, so the
      // global mutationCache handler in main.jsx already toasts it. This
      // just grabs the same message for the inline text under the button.
      setError(getErrorMessage(err, "Could not start payment. Please try again."));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#E8E8E8" }}>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

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

      <div className="flex flex-col gap-3 px-4 pt-2">
        {/* ── Card 1: Community + saved method ── */}
        <div className="bg-[#EFEFF1E5] rounded-2xl px-4 py-4">
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
                    {savedMethod.bank ?? "Bank account"} ●●●● {savedMethod.last4}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 py-1">
                You'll choose how to pay on the next screen.
              </p>
            )}

            {isRecurring && (
              <p className="text-[12px] text-gray-400 mt-2 pt-2 border-t border-gray-200">
                This plan will be saved for Auto-Pay after your first successful payment.
              </p>
            )}
          </div>
        </div>

        {/* ── Card 2: Plan details ── */}
        <div className="bg-[#EFEFF1E5] rounded-2xl px-4 py-4">
          <p className="text-[14px] font-normal text-gray-900 mb-4">Plan Details</p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-gray-500">Payment Schedule:</span>
            <span
              className="text-[12px] font-semibold px-3 py-0.5 rounded-full"
              style={{ background: "#EEF1FB", color: "#1C2B8A" }}
            >
              {isRecurring ? (obligation?.recurringPlan?.frequency ?? "Recurring") : "One-Time"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2.5 pb-3 border-b border-gray-100">
            <span className="text-[13px] text-gray-500">Plan:</span>
            <span className="text-[14px] text-gray-900">{obligation?.paymentLink?.title ?? "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-500">Total:</span>
            <span className="text-[15px] font-bold text-gray-900">{fmt(obligation?.amount)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 px-1">{error}</p>}

        {/* ── Make Payment button ── */}
        <button
          onClick={handlePay}
          disabled={initiatePayment.isPending || !obligation}
          className="w-full rounded-md py-4 text-[15px] font-semibold text-white mt-1 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-80"
          style={{ background: "#002FA7" }}
        >
          {initiatePayment.isPending ? "Processing..." : "Make Payment"}
        </button>
      </div>
    </div>
  );
}
