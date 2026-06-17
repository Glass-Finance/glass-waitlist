import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

// GET /api/v1/finance/transactions/me
// Returns the authenticated user's transaction history.
async function fetchTransactions() {
  const res = await client.get("/finance/transactions/me");
  return res.data.data; // unwrap envelope → { transactions: Tx[] } or Tx[]
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions", "me"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 2,      // 2 min — transactions don't change that fast
    gcTime:    1000 * 60 * 10,
    select: (data) => {
      // Normalise: backend may return array directly or wrapped in { transactions }
      const transactions = Array.isArray(data) ? data : (data?.transactions ?? []);

      // Sort newest-first in case the API doesn't guarantee order
      const sorted = [...transactions].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return { transactions: sorted };
    },
  });
}