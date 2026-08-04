import { lastLocalPaidAt } from "./localCache";

// For a recurring plan with no obligation record yet (common right after a
// payment — the next cycle's obligation isn't generated immediately), this
// checks whether the member already has a successful transaction for this
// link within the *current* billing cycle, so a just-paid recurring plan
// doesn't reappear as "upcoming" until the next cycle actually begins.
// Approximates the cycle as the current calendar week (WEEKLY) or calendar
// month (MONTHLY/others) — matches the plan's own billingDay semantics
// closely enough without needing to replicate the backend's exact cycle
// math client-side.
export function isPaidForCurrentCycle(link, transactions, { obligationId } = {}) {
  const lastSuccess = transactions
    .filter((t) => t.paymentLinkId === link.id && t.status === "success")
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const localPaidAt = lastLocalPaidAt({ paymentLinkId: link.id, obligationId });
  const paidDate = [lastSuccess?.date, localPaidAt]
    .filter(Boolean)
    .map((d) => new Date(d))
    .sort((a, b) => b - a)[0];
  if (!paidDate) return false;

  const now = new Date();
  const frequency = (link.frequency ?? "MONTHLY").toUpperCase();

  if (frequency === "WEEKLY") {
    return now - paidDate < 7 * 86400000;
  }
  // MONTHLY (and any other/unknown frequency) — same calendar month
  return (
    paidDate.getFullYear() === now.getFullYear() &&
    paidDate.getMonth() === now.getMonth()
  );
}

// An obligation the backend still reports unpaid can already be settled:
// payment verification writes status back asynchronously, and a recurring
// plan's obligation can stay PENDING until the next cycle's record is
// generated. Without this check, a member who just paid keeps seeing (and
// can keep re-paying) the same due. Treat the obligation as settled when a
// successful transaction exists for the same payment link — any time for
// one-time plans, within the current billing cycle for recurring ones.
export function isObligationSettled(o, transactions) {
  const obligationId = o.obligationId ?? o.id;
  if (!o.paymentLinkId && !obligationId) return false;
  // Exact match first: a successful transaction carrying this obligation's
  // own id settles it definitively, regardless of plan type or the cycle
  // approximations below (which can miss right at a cycle boundary).
  if (
    obligationId &&
    transactions.some(
      (t) =>
        t.status === "success" &&
        t.obligationId &&
        String(t.obligationId) === String(obligationId),
    )
  ) {
    return true;
  }
  if (o.type === "one-time") {
    return (
      transactions.some(
        (t) => t.paymentLinkId === o.paymentLinkId && t.status === "success",
      ) || !!lastLocalPaidAt({ paymentLinkId: o.paymentLinkId, obligationId })
    );
  }
  return isPaidForCurrentCycle(
    { id: o.paymentLinkId, frequency: o.frequency },
    transactions,
    { obligationId },
  );
}
