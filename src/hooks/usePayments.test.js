import { describe, it, expect, beforeEach } from "vitest";
import {
  isObligationSettled,
  isPaidForCurrentCycle,
  recordLocalPayment,
} from "./usePayments";

// This logic was the subject of two independent bug fixes in the same
// sprint (a backend obligation.status lag hiding already-paid dues as
// "Unpaid") -- these tests exist to keep that regression from recurring.

beforeEach(() => {
  localStorage.clear();
});

function successTx(overrides = {}) {
  return { status: "success", ...overrides };
}

describe("isObligationSettled", () => {
  it("returns false when the obligation has no paymentLinkId or id", () => {
    expect(isObligationSettled({}, [])).toBe(false);
  });

  it("is settled by an exact obligationId match on a successful transaction, regardless of type", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "recurring" };
    const transactions = [successTx({ obligationId: "ob-1" })];
    expect(isObligationSettled(obligation, transactions)).toBe(true);
  });

  it("does not match a successful transaction tied to a different obligationId", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "one-time" };
    const transactions = [successTx({ obligationId: "ob-2", paymentLinkId: "link-2" })];
    expect(isObligationSettled(obligation, transactions)).toBe(false);
  });

  it("one-time: settles via any successful transaction on the same payment link", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "one-time" };
    const transactions = [successTx({ paymentLinkId: "link-1" })];
    expect(isObligationSettled(obligation, transactions)).toBe(true);
  });

  it("one-time: settles via the local paid-log fallback when no transaction matches yet", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "one-time" };
    recordLocalPayment({ paymentLinkId: "link-1", obligationId: "ob-1" });
    expect(isObligationSettled(obligation, [])).toBe(true);
  });

  it("one-time: is not settled when nothing matches", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "one-time" };
    expect(isObligationSettled(obligation, [])).toBe(false);
  });

  it("recurring: delegates to the current-cycle check rather than any historical payment", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "recurring", frequency: "MONTHLY" };
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const transactions = [successTx({ paymentLinkId: "link-1", date: lastMonth.toISOString() })];
    // A past cycle's payment must NOT hide a genuinely new cycle's due obligation.
    expect(isObligationSettled(obligation, transactions)).toBe(false);
  });

  it("recurring: settles when the most recent successful payment falls in the current cycle", () => {
    const obligation = { id: "ob-1", paymentLinkId: "link-1", type: "recurring", frequency: "MONTHLY" };
    const transactions = [successTx({ paymentLinkId: "link-1", date: new Date().toISOString() })];
    expect(isObligationSettled(obligation, transactions)).toBe(true);
  });
});

describe("isPaidForCurrentCycle", () => {
  it("returns false with no matching transaction and no local paid log", () => {
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "MONTHLY" }, [])).toBe(false);
  });

  it("WEEKLY: true when the last payment was under 7 days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
    const transactions = [successTx({ paymentLinkId: "link-1", date: twoDaysAgo.toISOString() })];
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "WEEKLY" }, transactions)).toBe(true);
  });

  it("WEEKLY: false when the last payment was 7+ days ago", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
    const transactions = [successTx({ paymentLinkId: "link-1", date: tenDaysAgo.toISOString() })];
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "WEEKLY" }, transactions)).toBe(false);
  });

  it("MONTHLY (default): true when the last payment falls in the current calendar month", () => {
    const transactions = [successTx({ paymentLinkId: "link-1", date: new Date().toISOString() })];
    expect(isPaidForCurrentCycle({ id: "link-1" }, transactions)).toBe(true);
  });

  it("MONTHLY: false when the last payment was in a previous calendar month", () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const transactions = [successTx({ paymentLinkId: "link-1", date: lastMonth.toISOString() })];
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "MONTHLY" }, transactions)).toBe(false);
  });

  it("ignores transactions for a different payment link", () => {
    const transactions = [successTx({ paymentLinkId: "other-link", date: new Date().toISOString() })];
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "MONTHLY" }, transactions)).toBe(false);
  });

  it("ignores non-successful transactions", () => {
    const transactions = [{ paymentLinkId: "link-1", status: "failed", date: new Date().toISOString() }];
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "MONTHLY" }, transactions)).toBe(false);
  });

  it("falls back to the local paid log when no transaction matches", () => {
    recordLocalPayment({ paymentLinkId: "link-1" });
    expect(isPaidForCurrentCycle({ id: "link-1", frequency: "MONTHLY" }, [])).toBe(true);
  });
});
