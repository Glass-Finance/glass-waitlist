# ADR-004: Payment Idempotency

- Status: Current client behavior documented; backend guarantee requires confirmation
- Date: 2026-09-10

## Context

Payment initiation can be retried after a timeout or redirect interruption. Duplicate payment creation must not result from a repeated user action or network retry.

## Current decision and behavior

The frontend generates a UUID per active payment attempt and sends it as `idempotencyKey` to the payment initiation endpoint. The same key is reused by the mounted payment flow. The repository does not contain the backend persistence or uniqueness implementation, so server enforcement is not verified here.

## Recommended future direction

Require the backend to enforce idempotency using a key scoped to the authenticated payer and payment intent, retain the original result, and make duplicate requests return that result. Add contract and end-to-end tests before relying on the behavior for reconciliation or customer support workflows.
