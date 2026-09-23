import { useQuery } from "@tanstack/react-query";
import { getMyCommunities } from "../api/members";
import { fetchMyTransactions } from "./payments/helpers";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

// ─── All transactions (Payment History page) ──────────────────────────────────
// ["transactions"] is one shared cache entry (also observed by usePayments'
// Home history and useGlobalOverview's recent activity), so it goes through
// the single canonical queryFn/shape — see fetchMyTransactions in
// ./payments/helpers. This hook used to keep a private shaper for that same
// key; two shapers on one key meant the shape the page got depended on which
// observer fetched first. Ordering is a view concern of this page, so the
// newest-first sort happens below instead of inside the shared queryFn, which
// has to stay identical for every observer.
//
// The transactions endpoint doesn't reliably nest the community's logo on
// each record (only name/slug) -- same gap usePayments() already works
// around for obligations/links. Enrich from /communities/me here too, so
// the receipt's Community row isn't stuck showing no logo for every txn.
export function useTransactions() {
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchMyTransactions,
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

  // Enrich first (a logo lookup never changes `date`), then sort newest-first
  // here — the shared ["transactions"] queryFn must stay identical for every
  // observer, and this page's month grouping relies on the list arriving
  // already ordered.
  const data = (transactionsQuery.data ?? [])
    .map((tx) =>
      tx.communityLogo?.url || !tx.communitySlug
        ? tx
        : { ...tx, communityLogo: logoBySlug.get(tx.communitySlug) ?? tx.communityLogo },
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    data,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
  };
}
