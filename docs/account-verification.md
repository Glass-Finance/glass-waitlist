# Account, phone, and identity flows

## Current behavior

This page describes the product flows for **sign-in**, **optional phone**, and **identity verification (KYC)** as implemented in this frontend. Backend contracts remain authoritative (`docs/authentication.md`, `docs/kyc.md`, `docs/authorization.md`).

### Sign-in is email-only

- `/sign-in` and `/member/app-sign-in` accept an **email** only (password tab and One-Time Code tab).
- Labels, placeholders, and validation say email — not “email or phone”.
- Phone-shaped input is rejected as an invalid email.
- Password reset (`ForgotPassword`) is already email-only.
- The backend may still accept a phone identifier on login APIs; the **product decision** is email-only UI. Do not reintroduce phone as a sign-in identifier without an explicit product change.

### Phone is optional and added after signup

Phone is **not** collected during registration (email + name/password → email OTP). The number is **added later** in Settings when needed (payment reminders, account recovery).

| Surface                           | First-time copy                                      | After the number is verified            |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| Member home nudge                 | **Add Your Phone Number**                            | Hidden                                  |
| Member / dashboard Profile pencil | **Add phone number**                                 | **Update phone number**                 |
| Member `/member/verify-phone`     | **Add Your Phone Number** / CTA **Add Phone Number** | **Update Your Phone Number**            |
| Dashboard Profile phone panel     | **Add Your Phone Number** / CTA **Add Phone Number** | **Update…**                             |
| Success after OTP                 | **Your Phone Number Has Been Added!**                | **Your Phone Number Has Been Updated!** |

**Do not use “Verify phone number” for the first-time flow.** OTP still confirms ownership of the number; product language for the first entry is **add**, because users never had a phone field at account creation.

Flow (same OTP mechanics for add vs update; mode is `user.phoneVerified`):

1. Enter number → `POST` request (action verification / phone update request).
2. Enter 6-digit code → confirm (`PATCH` user phone / update hook).
3. Refresh session user; success badge; navigate back.

Entry points: member home banner (until `phoneVerified`), member Profile, community-admin dashboard banner, dashboard Settings → Account → Profile.

### Identity verification (KYC)

Members verify identity with Smile ID before creating or managing communities (and can complete it from Settings). Full detail: [`kyc.md`](kyc.md).

Summary:

- Member page: `/member/verify-identity` (+ history).
- Status badges: Settings Account, Home header, communities surfaces.
- Gate: bottom sheet when summary is not `APPROVED` (fails open on load/error).
- Platform admin: Admin Panel → KYC review queue and decision modal.
- Kill switch: `VITE_FLAGS={"kycDisabled":true}`.

### Related env / flags

| Variable       | Role                                             |
| -------------- | ------------------------------------------------ |
| `VITE_FLAGS`   | `paymentsDisabled`, `kycDisabled` kill switches  |
| `VITE_SMILE_*` | Smile ID SDK init only (token minted by backend) |

See `.env.example` and `docs/runbooks/incident-rollback.md`.

## Proposed/future direction

- Confirm with product whether passwordless OTP login stays email-only forever or phone login returns as a deliberate feature.
- Optional: rename route `verify-phone` → `add-phone` with redirects if URL copy should match product language (not required for correctness).
- Marketing copy under `glass-waitlist-v1` must be re-ported if landing “how it works” steps change here (see root `README.md` two-repo rule).
