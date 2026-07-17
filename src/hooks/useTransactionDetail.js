import { useQuery } from "@tanstack/react-query";
import { getTransaction, getMyCommunities } from "../api/members";
import { lookupLocalFee } from "./usePayments";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

// Full-detail shape for a single transaction, used by the Transaction
// Details page. Deliberately keeps every field optional/defensive beyond
// what useTransactions.js already confirms exists on the list endpoint --
// getTransaction() was already wired up in api/members.js but never
// actually called anywhere, so the extra detail fields it may return
// (fee, transaction type, initiator) haven't been verified against a real
// schema. Rows for those only render when the field is actually present
// (see TransactionDetail.jsx), so a wrong guess here just hides a row
// instead of showing incorrect data.
function shapeDetail(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: raw.amountPaid,
    description: raw.description ?? raw.paymentLink?.title ?? "Payment",
    communityName: raw.community?.name,
    communitySlug: raw.community?.slug,
    communityLogo: raw.community?.logo,
    date: raw.paidAt ?? raw.createdAt,
    status: (() => { const s = (raw.status ?? "").toLowerCase(); return s === "successful" ? "success" : s; })(),
    planName: raw.paymentLink?.title,
    channel: raw.channel,
    reference: raw.internalReference,
    // No dedicated fee field on the transaction record -- derived the same
    // way PaymentSummary.jsx's confirmed "Platform Fee" row is (billedAmount
    // minus amount), using amountPaid (actual charged total) vs amount (due
    // amount) here, guarded against a nonsensical negative fee.
    feeMinor:
      raw.feeMinor ??
      raw.fee ??
      (raw.amountPaid != null && raw.amount != null && raw.amountPaid > raw.amount
        ? raw.amountPaid - raw.amount
        : null),
    transactionType: raw.transactionType ?? raw.paymentMethod ?? null,
    initiatedBy: raw.initiatedBy ?? (raw.recurringPlan ? "Auto-Pay" : null),
  };
}

// Same gap useTransactions.js already works around: the transactions
// endpoint doesn't reliably nest the community's logo (only name/slug),
// so it's enriched from /communities/me here too -- otherwise the receipt
// opened from Transaction Details/Payment Success (both use this hook)
// shows no logo even for communities that do have one.
// skipAuthRedirect: the payment-success screens (PaymentCallback.jsx,
// PaymentSuccess.jsx) fetch this the instant verification lands on
// "success" -- right when the app may still be mid-token-refresh after a
// real Paystack redirect (see client.js's window.__glassIsRestoring and
// verifyPayment's own _skipAuthRedirect). Without opting out here too, a
// transient 401 on *this* particular call bypassed that protection and hard-
// redirected straight to sign-in a beat after the user already saw "Payment
// Successful" -- confirmed as the same "bounced to sign-in right after
// success" regression reported a second time. The plain Transaction Details
// page (a real ProtectedRoute-gated route where a truly-dead session should
// still bounce normally) leaves this off.
export function useTransactionDetail(transactionId, { skipAuthRedirect = false } = {}) {
  const config = skipAuthRedirect ? { _skipAuthRedirect: true } : {};

  const detailQuery = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const res = await getTransaction(transactionId, config);
      const shaped = shapeDetail(res.data?.data ?? res.data);
      // The completed transaction record often has no fee field populated
      // at all -- fall back to the fee cached client-side at checkout
      // (see recordLocalFee/lookupLocalFee in usePayments.js) rather than
      // showing "—" for a fee the payer already saw and paid.
      if (shaped.feeMinor == null) {
        const localFee = lookupLocalFee(transactionId);
        if (localFee != null) shaped.feeMinor = localFee;
      }
      return shaped;
    },
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 2,
  });

  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await getMyCommunities(config);
      return unwrapList(res);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!transactionId,
  });

  const tx = detailQuery.data;
  const data =
    tx && !tx.communityLogo?.url && tx.communitySlug
      ? {
          ...tx,
          communityLogo:
            (communitiesQuery.data ?? []).find(
              (c) => (c.slug ?? c.community?.slug) === tx.communitySlug,
            )?.logo ?? tx.communityLogo,
        }
      : tx;

  return {
    data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
  };
}
