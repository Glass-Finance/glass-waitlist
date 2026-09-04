// ─── Local payment log ────────────────────────────────────────────────────────
// Keep a short-lived record of successful payments witnessed client-side for
// payment recovery and diagnostics. Displayed paid status comes from the API's
// obligation.status field.
const PAID_LOG_KEY = "glass_local_paid_log";

function readPaidLog() {
  try {
    return JSON.parse(localStorage.getItem(PAID_LOG_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function recordLocalPayment({ paymentLinkId, obligationId }) {
  if (!paymentLinkId && !obligationId) return;
  try {
    const log = readPaidLog();
    log.push({
      paymentLinkId: paymentLinkId ?? null,
      obligationId: obligationId ?? null,
      paidAt: new Date().toISOString(),
    });
    localStorage.setItem(PAID_LOG_KEY, JSON.stringify(log.slice(-50)));
  } catch {
    /* ignore */
  }
}

// The payment context is stashed before redirecting to Paystack so whichever
// page confirms the payment afterwards (callback page, or the pending-ref
// check on Home) can write the paid log for the right plan.
const PENDING_CTX_KEY = "paymentPendingCtx";

export function stashPendingPaymentCtx(ctx) {
  try {
    sessionStorage.setItem(PENDING_CTX_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

// Non-destructive read -- settleLocalPaymentForReference (below) consumes
// this same key on terminal success, so anything else that needs the stashed
// plan context (e.g. AdminPaymentCallback deciding whether to offer the
// Auto-Pay prompt after a redirect-based payment) must peek it first, in the
// same tick, before that consumes it.
export function peekPendingPaymentCtx() {
  try {
    const raw = sessionStorage.getItem(PENDING_CTX_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Local fee cache ────────────────────────────────────────────────────────
// The transaction fee is known and already shown to the payer at checkout
// (PaymentSummary.jsx's "Platform Fee" = billedAmount - amount), but the
// completed transaction record fetched afterwards (getTransaction/
// getCommunityTransaction) often comes back with no fee field populated at
// all -- the receipt then has no way to show a real number, only "—". Since
// the fee is deterministic and already known the moment payment is
// initiated, it's cached here under every identifier the transaction could
// later be looked up by (Paystack's own reference, and the real internal
// transactionId once verifyPayment's response reveals it) so
// useTransactionDetail can fall back to it instead of losing the number
// entirely.
const FEE_LOG_KEY = "glass_local_fee_log";

function readFeeLog() {
  try {
    return JSON.parse(localStorage.getItem(FEE_LOG_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function recordLocalFee(key, feeMinor) {
  if (!key || feeMinor == null) return;
  try {
    const log = readFeeLog();
    log[key] = feeMinor;
    const keys = Object.keys(log);
    if (keys.length > 100) {
      for (const k of keys.slice(0, keys.length - 100)) delete log[k];
    }
    localStorage.setItem(FEE_LOG_KEY, JSON.stringify(log));
  } catch {
    /* ignore */
  }
}

export function lookupLocalFee(key) {
  if (!key) return null;
  const value = readFeeLog()[key];
  return value ?? null;
}

// transactionId is optional -- known once verifyPayment's response reveals
// it (a beat after settlement), so the fee gets cached under whichever
// identifiers are available at the time this runs.
export function settleLocalPaymentForReference(reference, transactionId) {
  try {
    const raw = sessionStorage.getItem(PENDING_CTX_KEY);
    if (!raw) return;
    const ctx = JSON.parse(raw);
    if (!reference || !ctx.reference || ctx.reference === reference) {
      recordLocalPayment(ctx);
      if (ctx.feeMinor != null) {
        recordLocalFee(ctx.reference, ctx.feeMinor);
        if (transactionId) recordLocalFee(transactionId, ctx.feeMinor);
      }
      sessionStorage.removeItem(PENDING_CTX_KEY);
    }
  } catch {
    /* ignore */
  }
}
