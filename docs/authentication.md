# Authentication

## Current behavior

Authentication is coordinated by `AuthContext` and `src/services/authService.js`. Password, passwordless OTP, Google OAuth, registration, email/phone verification, password reset, and TOTP endpoints are called through the shared Axios client.

Successful sessions store `accessToken`, `refreshToken`, basic user identifiers, and the serialized user snapshot in browser `localStorage`. The Axios request interceptor sends the access token as a Bearer token. A `401` response can trigger a refresh-token request; concurrent failed requests wait in a queue. Failed refresh clears the local session and redirects to the appropriate sign-in route.

The context restores a session on startup, clears React Query caches on login/logout, and listens for access-token removal in another browser tab. Short-lived invite, redirect, and verification state uses `sessionStorage` where the relevant flow requires it.

## Proposed/future direction

Consider moving refresh-token handling to an `HttpOnly`, `Secure`, `SameSite` cookie managed by the backend, keeping access tokens out of persistent browser storage where feasible. This requires coordinated backend and deployment changes and must be threat-modeled before implementation. Do not change storage as part of documentation-only foundation work.
