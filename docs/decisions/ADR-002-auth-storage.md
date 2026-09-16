# ADR-002: Current Browser Auth Storage

- Status: Accepted for current implementation; future improvement proposed
- Date: 2026-09-10

## Context

The current Axios interceptor needs access to tokens for API requests and refresh handling across route changes and reloads.

## Decision

The current implementation stores access and refresh tokens in `localStorage`, alongside a serialized user snapshot. Short-lived flow state uses `sessionStorage`. This ADR documents the implementation; it does not claim that browser storage is the preferred long-term security model.

## Future direction

Evaluate an `HttpOnly`, `Secure`, `SameSite` refresh-token cookie and a short-lived in-memory access token with the backend team. This requires a threat model, CSRF design, migration plan, and coordinated backend changes.
