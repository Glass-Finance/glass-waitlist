// Backend list endpoints return a paginated envelope: { content, pageNumber, ... }
// Some return a bare array. Handle both.
import { getMyTransactions } from "../../api/members";
import { isPaidObligationStatus } from "../../utils/paymentStatus";
import { shapeTransaction } from "./shape";

export function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

export function deriveStatus(obligation) {
  if (isPaidObligationStatus(obligation.status)) return "paid";
  const days = Math.ceil((new Date(obligation.dueDate) - new Date()) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}

// ── The single queryFn behind ["transactions"] ───────────────────────────────
// GET /api/v1/transactions (the member's own list) is ONE resource, so every
// observer of ["transactions"] must share this function and its shape:
//   - useTransactions      → Payment History page (/member/transactions)
//   - usePayments          → Home "Payment History" (data.history)
//   - useGlobalOverview    → CommunitiesHome "Recent Activity"
// Until now each hook had its own near-identical queryFn mapping the same
// response through its own shaper, so the entry's shape depended on which
// observer fetched first — a consumer could be handed the other variant for
// as long as the entry stayed fresh (up to staleTime). shapeTransaction in
// ./shape is the canonical representation; it covers every field the three
// consumers above read.
export async function fetchMyTransactions() {
  try {
    const res = await getMyTransactions();
    return unwrapList(res).map(shapeTransaction);
  } catch (err) {
    // 404 means the member has no transactions yet — a valid empty state,
    // not an error (same handling usePayments already applies to obligations).
    if (err?.response?.status === 404) return [];
    throw err;
  }
}
