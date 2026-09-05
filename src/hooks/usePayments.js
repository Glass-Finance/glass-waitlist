// Barrel re-export — the payments domain used to live in this single ~860
// line file (local storage caching, cycle/settlement math, obligation/link/
// transaction shaping, and five separate React Query hooks all mixed
// together). It's now split by concern under ./payments/, kept together here
// so every existing `from "hooks/usePayments"` import site is unaffected.
export {
  recordLocalPayment,
  stashPendingPaymentCtx,
  peekPendingPaymentCtx,
  recordLocalFee,
  lookupLocalFee,
  settleLocalPaymentForReference,
} from "./payments/localCache";

export { useGlobalOverview } from "./payments/useGlobalOverview";

export { usePayments } from "./payments/useMainPayments";

export {
  isAuthorisationExpired,
  findAuthorisationForPlan,
} from "./payments/authorisation";

export {
  fetchAuthorisationsOnce,
  useManagePayments,
} from "./payments/useManagePayments";

export { usePendingPaymentVerification } from "./payments/usePendingPaymentVerification";

export { useInitiatePayment } from "./payments/useInitiatePayment";
