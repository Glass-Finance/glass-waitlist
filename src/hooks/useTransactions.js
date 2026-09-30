import { useQuery } from "@tanstack/react-query";
import { getMyCommunities } from "../api/members";
import { fetchMyTransactions } from "./payments/helpers";
import { normalizeImageObject } from "../utils/normalizeImageFields";

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

  // SECURITY: this map is a SECOND, independent path by which a server logo
  // reaches a transaction's `communityLogo` — it reconstructs the value from
  // /communities/me rather than from the transaction payload that shape.js
  // normalized. It runs its own query here (not useMyCommunities), so it is not
  // covered by the ["communities"] boundary either. Normalize at construction;
  // normalizing only shapeTransaction() would leave this enrichment able to
  // reintroduce an unsanitized URL onto an already-shaped transaction.
  const logoBySlug = new Map(
    (communitiesQuery.data ?? []).map((c) => [
      c.slug ?? c.community?.slug,
      normalizeImageObject(c.logo ?? c.community?.logo) ?? null,
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
