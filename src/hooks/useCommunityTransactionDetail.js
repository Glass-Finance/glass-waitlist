import { useQuery } from "@tanstack/react-query";
import { getCommunityTransaction } from "../api/transactions";
import { useCommunity } from "./useCommunity";

// Admin-side counterpart to useTransactionDetail.js (member app) -- same
// shape, same defensive/optional-field philosophy (fee/transaction type/
// initiator aren't confirmed against a real schema, so rows for those only
// render when actually present), just backed by the community-scoped
// endpoint an admin can call for any member's transaction rather than the
// member-only "my transactions" one.
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
    payerName: [raw.member?.user?.firstName ?? raw.member?.firstName, raw.member?.user?.lastName ?? raw.member?.lastName]
      .filter(Boolean)
      .join(" ") || raw.member?.user?.email || raw.member?.email || null,
    payerEmail: raw.member?.user?.email ?? raw.member?.email ?? null,
    // Same derivation as the member app: no dedicated fee field on the
    // transaction record, so it's the gap between what was actually
    // charged (amountPaid) and the due amount, when both are present.
    feeMinor:
      raw.feeMinor ??
      raw.fee ??
      (raw.amountPaid != null && raw.amount != null && raw.amountPaid > raw.amount
        ? raw.amountPaid - raw.amount
        : null),
    transactionType: raw.transactionType ?? raw.paymentMethod ?? null,
    // Used to guess "Auto-Pay" whenever the plan was recurring -- now
    // known wrong: confirmed with backend that savePaymentMethod is a
    // real per-payment choice, so a recurring plan can just as easily be
    // paid manually (Auto-Pay declined, or a manual catch-up on a specific
    // cycle) as auto-charged. Only show this when the backend says so
    // directly; the row already hides itself when this is null.
    initiatedBy: raw.initiatedBy ?? null,
  };
}

export function useCommunityTransactionDetail(communityId, transactionId) {
  const detailQuery = useQuery({
    queryKey: ["community", communityId, "transaction", transactionId],
    queryFn: async () => {
      const res = await getCommunityTransaction(communityId, transactionId);
      return shapeDetail(res.data?.data ?? res.data);
    },
    enabled: !!communityId && !!transactionId,
    staleTime: 1000 * 60 * 2,
  });

  // Same logo gap useTransactions.js/useTransactionDetail.js work around on
  // the member side -- fall back to the community's own logo (already
  // known here, no extra list fetch needed) when the transaction record
  // doesn't nest one.
  const { data: community } = useCommunity(communityId);

  const tx = detailQuery.data;
  const data =
    tx && !tx.communityLogo?.url && community?.logo?.url
      ? { ...tx, communityLogo: community.logo }
      : tx;

  return {
    data,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
  };
}
