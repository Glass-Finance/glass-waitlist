import { useQuery } from "@tanstack/react-query";
import { getCommunityTransaction } from "../api/transactions";
import { useCommunity } from "./useCommunity";

// Admin-side counterpart to useTransactionDetail.js (member app) -- same
// shape, same defensive/optional-field philosophy (fee/transaction type/
// initiator aren't confirmed against a real schema, so rows for those only
// render when actually present), just backed by the community-scoped
// endpoint an admin can call for any member's transaction rather than the
// member-only "my transactions" one.
// Field names below confirmed against the real CommunityTransactionResponse
// schema (backend Swagger). member here is its own flat object
// ({firstName, lastName, email, profileImage, ...}) -- there's no nested
// member.user sub-object, so that guess was always falling through to the
// second branch below rather than actually matching. The transaction also
// carries its own root-level `user` (the payer's platform identity, with
// its own profileImage) separate from `member` (their community-specific
// record) -- member's photo is preferred since it's the identity actually
// tied to this community, falling back to the platform one.
function shapeDetail(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    amountPaid: raw.obligation?.amountPaid ?? null,
    description: raw.description ?? raw.paymentLink?.title ?? "Payment",
    communityName: raw.community?.name,
    communitySlug: raw.community?.slug,
    communityLogo: raw.community?.logo,
    date: raw.paidAt ?? raw.createdAt,
    status: (() => { const s = (raw.status ?? "").toLowerCase(); return s === "successful" ? "success" : s; })(),
    planName: raw.paymentLink?.title,
    channel: raw.channel,
    reference: raw.internalReference,
    payerName: [raw.member?.firstName ?? raw.user?.firstName, raw.member?.lastName ?? raw.user?.lastName]
      .filter(Boolean)
      .join(" ") || raw.member?.email || raw.user?.email || null,
    payerEmail: raw.member?.email ?? raw.user?.email ?? null,
    payerPhoto: raw.member?.profileImage?.url ?? raw.user?.profileImage?.url ?? null,
    // platformFee is a real, confirmed field on this response -- prefer it
    // directly; billedAmount minus amount (both also confirmed present) is
    // the fallback derivation if it's ever absent on a given record.
    feeMinor:
      raw.platformFee ??
      (raw.billedAmount != null && raw.amount != null && raw.billedAmount > raw.amount
        ? raw.billedAmount - raw.amount
        : null),
    // Confirmed absent from the transaction schema, not a guess that
    // happened to fail -- only shown when the backend states it directly;
    // the row already hides itself when this is null.
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
