import { useQuery } from "@tanstack/react-query";
import { getMyTransactions, getTransaction } from "../api/members";

function shapeTransaction(raw) {
  return {
    id: raw.id,
    amount: raw.amount,
    description: raw.description ?? raw.name ?? "Payment",
    communityName: raw.community?.name ?? raw.communityName,
    date: raw.createdAt ?? raw.created_at,
    status: raw.status?.toLowerCase(), // "success" | "failed" | "pending"
    reference: raw.reference,
    type: raw.type ?? "one-time",
    planName: raw.planName ?? raw.plan?.name,
    logoColor: raw.community?.color ?? "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
  };
}

// ─── All transactions (Payment History page) ──────────────────────────────────
export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getMyTransactions();
      const raw = res.data?.data ?? [];
      // Sort newest first
      return raw
        .map(shapeTransaction)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Single transaction detail ────────────────────────────────────────────────
export function useTransaction(transactionId) {
  return useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const res = await getTransaction(transactionId);
      return shapeTransaction(res.data?.data ?? res.data);
    },
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 5,
  });
}
