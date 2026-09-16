# Payments

## Current behavior

Payment API wrappers live primarily in `src/api/members.js` and `src/api/payments.js`. React Query mutations initiate payment-link payments, then invalidate obligation and transaction queries. Payment pages handle the processor redirect and call the backend verification endpoint using the returned reference. Saved payment authorizations support auto-pay flows.

Payment initiation sends an `idempotencyKey`, amount, obligation information, and payment metadata. Member and admin payment UI components create a UUID for the active payment attempt and reuse it for retries within that mounted flow. The frontend cannot verify whether the backend persists and enforces that key, so server-side idempotency is an assumption to confirm with the backend.

The browser does not directly implement settlement, ledger, or processor-side authorization. Those behaviors belong to the backend and payment processor integration.

## Proposed/future direction

The backend should require and persist an idempotency key for every payment creation request, scope it to the authenticated payer and payment intent, and return the original result for safe retries. Add an end-to-end test covering timeout, retry, and duplicate-submit behavior before changing the UI contract.
