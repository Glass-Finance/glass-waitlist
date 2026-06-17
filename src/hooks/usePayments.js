import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

// GET /api/v1/finance/obligations/me
// Returns the authenticated user's payment obligations across all communities.
async function fetchObligations() {
  const res = await client.get("/finance/obligations/me");
  return res.data.data;
}

function resolveStatus(obligation) {
  if (obligation.status) return obligation.status; // trust backend if present

  const days = obligation.dueDate
    ? Math.ceil((new Date(obligation.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  if (days === null) return "upcoming";
  if (days < 0)  return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments", "obligations", "me"],
    queryFn: fetchObligations,
    staleTime: 1000 * 60 * 2,
    gcTime:    1000 * 60 * 10,
    select: (data) => {
      const raw = Array.isArray(data) ? data : (data?.obligations ?? data?.payments ?? []);

      const obligations = raw.map((o) => ({
        ...o,
        _resolvedStatus: resolveStatus(o),
      }));

      // Sort: overdue first, then by dueDate ascending
      const sorted = [...obligations].sort((a, b) => {
        const priority = { overdue: 0, due_soon: 1, upcoming: 2, paid: 3 };
        const pa = priority[a._resolvedStatus] ?? 2;
        const pb = priority[b._resolvedStatus] ?? 2;
        if (pa !== pb) return pa - pb;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      // The most urgent unpaid obligation becomes the hero card
      const nextDue =
        sorted.find((o) => o._resolvedStatus !== "paid") ?? null;

      // Upcoming list = everything except the hero card
      const upcoming = nextDue
        ? sorted.filter((o) => o.id !== nextDue.id)
        : sorted;

      return { nextDue, upcoming, all: sorted };
    },
  });
}