# KYC (Identity Verification)

## Current behavior

Frontend-only integration against the Glass backend KYC API (`kyc-frontend-integration.md` is the contract source). Smile ID Biometric KYC is the provider; Glass mints the capture token (including `callback_url`) on `POST /kyc/attempts`. The browser never stores the token (memory only) and never sends ID numbers or selfies to Glass.

- **Member:** `/member/verify-identity` reads `GET /kyc` as the source of truth, starts/refreshes an attempt, runs the Smile ID CDN SDK, then `confirm-submission` only on client success. Status refreshes on window focus and after mutations (no polling). Attempt history: `/member/verify-identity/history`.
- **Status interpretation** lives in `src/utils/kycStatus.js` (labels, chips, `isKycApproved` / `isKycTerminal`, id-type labels). Admin table colors also mirror the enum set in platform-admin `shared.js` `STATUS_COLORS`.
- **Gates:** community create/manage shows `KycRequiredSheet` only when summary is explicitly not `APPROVED`. Loading/error fails open — backend remains authoritative (`docs/authorization.md`).
- **Badges:** Settings Account row, Home header (when not approved), Create Community actions.
- **Platform admin:** Admin Panel → KYC tab lists `/admin/kyc/attempts` (default `IN_REVIEW`), detail modal loads full evidence before Approve/Reject/Revoke/Attempt-policy (reason required; `409` reloads).
- **Kill switch:** `VITE_FLAGS={"kycDisabled":true}` hides member entry points and gates.

## Proposed/future direction

- Documented KYC status contract in this `docs/` tree when the backend guide is checked into the repo (today it lives outside).
- Optional cache-shape test for the attempts list if a second consumer appears (pattern: `src/__tests__/hooks/*CacheShape.test.jsx`).
- E2E coverage for the member start path if product prioritizes it (no real Smile ID in Playwright; would need a support.js stub).
