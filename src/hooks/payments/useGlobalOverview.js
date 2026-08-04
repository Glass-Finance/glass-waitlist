import { useQuery } from "@tanstack/react-query";
import { getMyObligations, getMyTransactions } from "../../api/members";
import { unwrapList, deriveStatus } from "./helpers";
import { shapeObligation, shapeTransaction } from "./shape";
import { isObligationSettled } from "./settlement";

// ─────────────────────────────────────────────────────────────────────────────
// Global overview — cross-community rollup for the home dashboard.
// Unlike usePayments (which scopes to one active community), this returns the
// user's unpaid obligations and recent transactions across ALL communities.
// Shares the ["obligations"]/["transactions"] cache keys with usePayments so
// neither hook triggers duplicate fetches.
// ─────────────────────────────────────────────────────────────────────────────
export function useGlobalOverview() {
  const obligationsQuery = useQuery({
    queryKey: ["obligations"],
    queryFn: async () => {
      try {
        const res = await getMyObligations();
        return unwrapList(res).map(shapeObligation);
      } catch (err) {
        if (err?.response?.status === 404) return [];
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        const res = await getMyTransactions();
        return unwrapList(res).map(shapeTransaction);
      } catch (err) {
        if (err?.response?.status === 404) return [];
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  const upcoming = [...(obligationsQuery.data ?? [])]
    .filter((o) => {
      const linkIsActive = o.linkStatus === "ACTIVE" || !o.linkStatus;
      return linkIsActive && o.status !== "PAID" && !isObligationSettled(o, transactionsQuery.data ?? []);
    })
    .sort((a, b) => {
      const sa = deriveStatus(a);
      const sb = deriveStatus(b);
      if (sa === "overdue" && sb !== "overdue") return -1;
      if (sb === "overdue" && sa !== "overdue") return 1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  const recentActivity = [...(transactionsQuery.data ?? [])].sort(
    (a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0),
  );

  return {
    upcoming,
    recentActivity,
    isLoading: obligationsQuery.isLoading || transactionsQuery.isLoading,
    error: obligationsQuery.error ?? null,
  };
}
