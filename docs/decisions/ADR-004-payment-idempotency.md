# ADR-004: Payment Idempotency

- Status: Client behavior documented; backend requires and persists the key (verified via live OpenAPI); duplicate-key replay behavior still to confirm
- Date: 2026-09-10
- Updated: 2026-09-22 (live swagger check)

## Context

Payment initiation can be retried after a timeout or redirect interruption. Duplicate payment creation must not result from a repeated user action or network retry.

## Current decision and behavior

The frontend generates a UUID per active payment attempt and sends it as `idempotencyKey` to the payment initiation endpoint. The same key is reused by the mounted payment flow.

Server-side contract, from the live OpenAPI spec (`/v3/api-docs/springdocDefault`, OAS 3.1):

- `InitializePaymentRequest` (body of `POST /api/v1/payments/pay/payment-links/{paymentLinkIdentifier}`) declares `idempotencyKey` as a **required** string (`minLength: 1`) — requests without it fail validation.
- `TransactionResponse` echoes `idempotencyKey`, so the backend **persists** the key on the transaction record rather than discarding it.

What the spec does **not** document: the init endpoint only lists a `200` response — there is no stated conflict/replay status (e.g. `409`) or guarantee that a repeated key returns the original initialization result instead of creating a second intent. Require + persist is the standard setup for that lookup, but the replay behavior is still an open question for the backend team.

## Recommended future direction

Confirm with the backend that a repeated `idempotencyKey` returns the original transaction (or a conflict) and never initializes a second charge — ideally scoped to the authenticated payer and payment intent. Tooling already in the repo:

- `npm run probe:idempotency` (`scripts/probe-payment-idempotency.mjs`) — fires the same key twice against the live API and prints PASS/FAIL (needs `GLASSPAY_TOKEN` + `GLASSPAY_PAYMENT_LINK`; does not open checkout, so no money moves).
- `npm run test:e2e` (`e2e/payment-idempotency.spec.js`) — proves the client reuses one key across a fail-and-retry in a real browser.
- `src/__tests__/api/paymentIdempotencyContract.test.js` — pins the OpenAPI required/minLength contract (set `RUN_LIVE_API_DOCS=1` to also re-fetch the live spec).

Add an end-to-end timeout/retry test (same key twice → one charge) before relying on the behavior for reconciliation or customer support workflows.
