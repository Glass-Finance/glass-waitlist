# Error Handling

## Current behavior

Axios rejects failed requests and the shared client handles authentication-specific `401` responses, including refresh and session expiry. Feature code uses the existing error helpers and UI notifications to present request failures. Payment callback flows can opt out of the global redirect so they can preserve payment context and show their own state.

Components should distinguish validation errors, expected empty states, authorization failures, expired sessions, and unexpected server/network failures. Do not expose raw backend responses or tokens in user-facing messages.

## Proposed/future direction

Standardize an API error shape at the client boundary, add a small set of user-safe error categories, and capture unexpected failures through the existing optional Sentry integration. Add tests for representative `401`, `403`, validation, timeout, and processor-callback failures.
