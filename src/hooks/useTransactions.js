import { useQuery } from "@tanstack/react-query";
import { getMyTransactions, getMyCommunities } from "../api/members";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

function shapeTransaction(raw) {
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
    type: raw.recurringPlan ? "recurring" : "one-time",
    planName: raw.paymentLink?.title,
    channel: raw.channel,
    currency: raw.currency ?? "NGN",
    reference: raw.internalReference,
    feeMinor: raw.feeMinor ?? raw.fee ?? null,
    logoColor: "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
  };
}

// ─── All transactions (Payment History page) ──────────────────────────────────
// The transactions endpoint doesn't reliably nest the community's logo on
// each record (only name/slug) -- same gap usePayments() already works
// around for obligations/links. Enrich from /communities/me here too, so
// the receipt's Community row isn't stuck showing no logo for every txn.
export function useTransactions() {
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getMyTransactions();
      return unwrapList(res)
        .map(shapeTransaction)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    staleTime: 1000 * 60 * 2,
  });

  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await getMyCommunities();
      return unwrapList(res);
    },
    staleTime: 1000 * 60 * 5,
  });

  const logoBySlug = new Map(
    (communitiesQuery.data ?? []).map((c) => [
      c.slug ?? c.community?.slug,
      c.logo ?? c.community?.logo ?? null,
    ]),
  );

  const data = (transactionsQuery.data ?? []).map((tx) =>
    tx.communityLogo?.url || !tx.communitySlug
      ? tx
      : { ...tx, communityLogo: logoBySlug.get(tx.communitySlug) ?? tx.communityLogo },
  );

  return {
    data,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
  };
}
