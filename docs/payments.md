# Payments

## Current behavior

Payment API wrappers live primarily in `src/api/members.js` and `src/api/payments.js`. React Query mutations initiate payment-link payments, then invalidate obligation and transaction queries. Payment pages handle the processor redirect and call the backend verification endpoint using the returned reference. Saved payment authorizations support auto-pay flows.

Payment initiation sends an `idempotencyKey`, amount, obligation information, and payment metadata. Member and admin payment UI components create a UUID for the active payment attempt and reuse it for retries within that mounted flow.

The live OpenAPI spec (`/v3/api-docs/springdocDefault`) confirms the backend **requires** `idempotencyKey` on `InitializePaymentRequest` (`required: ["idempotencyKey"]`) and **persists** it (`TransactionResponse.idempotencyKey`). **Backend confirmed (2026-09-23):** a repeated key returns the original result (or a conflict) and never initializes a second charge — double-charge via retry is not possible end-to-end given the client reuses one key per attempt (see ADR-004).

The browser does not directly implement settlement, ledger, or processor-side authorization. Those behaviors belong to the backend and payment processor integration.

## Residual follow-up

Run `npm run probe:idempotency` once with production credentials to capture a live PASS artifact. Client-side reuse is covered by unit + E2E tests (`e2e/payment-idempotency.spec.js`).
