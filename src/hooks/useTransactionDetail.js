import { useQuery } from "@tanstack/react-query";
import { getTransaction } from "../api/members";

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

export function useTransactionDetail(transactionId) {
  return useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const res = await getTransaction(transactionId);
      return shapeDetail(res.data?.data ?? res.data);
    },
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 2,
  });
}
