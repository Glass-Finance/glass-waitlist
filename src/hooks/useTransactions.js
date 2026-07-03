import { useQuery } from "@tanstack/react-query";
import { getMyTransactions } from "../api/members";

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
    date: raw.paidAt ?? raw.createdAt,
    status: (raw.status ?? "").toLowerCase(), // "success" | "failed" | "pending" | "initiated"
    type: raw.recurringPlan ? "recurring" : "one-time",
    planName: raw.paymentLink?.title,
    channel: raw.channel,
    currency: raw.currency ?? "NGN",
    logoColor: "#1C2B8A",
    logoText: (raw.community?.name ?? "C").charAt(0).toUpperCase(),
  };
}

// ─── All transactions (Payment History page) ──────────────────────────────────
export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getMyTransactions();
      // Sort newest first
      return unwrapList(res)
        .map(shapeTransaction)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });
}
