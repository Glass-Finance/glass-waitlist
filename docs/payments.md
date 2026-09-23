# Payments

## Current behavior

Payment API wrappers live primarily in `src/api/members.js` and `src/api/payments.js`. React Query mutations initiate payment-link payments, then invalidate obligation and transaction queries. Payment pages handle the processor redirect and call the backend verification endpoint using the returned reference. Saved payment authorizations support auto-pay flows.

Payment initiation sends an `idempotencyKey`, amount, obligation information, and payment metadata. Member and admin payment UI components create a UUID for the active payment attempt and reuse it for retries within that mounted flow.

The live OpenAPI spec (`/v3/api-docs/springdocDefault`) confirms the backend **requires** `idempotencyKey` on `InitializePaymentRequest` (`required: ["idempotencyKey"]`) and **persists** it (`TransactionResponse.idempotencyKey`). The remaining unknown is replay behavior: the init endpoint documents only `200`, so whether a duplicate key returns the original result or a conflict is not in the contract — confirm with the backend before treating double-charge as impossible end-to-end.

The browser does not directly implement settlement, ledger, or processor-side authorization. Those behaviors belong to the backend and payment processor integration.

## Proposed/future direction

Confirm the backend's duplicate-key response (original result vs conflict, and uniqueness scope). Add an end-to-end test covering timeout, retry, and duplicate-submit behavior (same key twice → one charge) before changing the UI contract.
