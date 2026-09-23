# Testing Strategy

## Current baseline

Vitest runs in a jsdom environment through `vite.config.js`. Testing Library is used for React components. Existing tests cover pure utilities, payment and recurring-schedule logic, React Query hooks, authentication-related pages, payment pages, admin components, and selected member flows.

Tests are colocated under `src/__tests__/` and use `*.test.js` or `*.test.jsx`. The suite is primarily unit and component-level; it does not replace manual verification against the real backend because this repository has no local backend or sandbox.

## Expectations

Add focused tests for changed pure logic, hook behavior, route guards, and user-visible error or loading states. Mock API modules at the boundary. Keep tests deterministic and independent of real credentials or production services. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before opening a PR.

## Gaps for later sprints

Priorities include broader route-guard coverage, API error-state coverage, auth refresh behavior, and payment retry/idempotency behavior.

## Browser E2E (Playwright)

Minimal critical-path coverage lives in `e2e/` (spec files named `*.e2e.js` so Vitest's default include never matches them) and runs with `npm run test:e2e`. `playwright.config.js` starts or reuses the Vite dev server on port 3000, runs Chromium only, single-worker, `list` reporter; `test-results/` is git- and lint-ignored.

The suite is fully stubbed and deterministic: one catch-all dispatcher in `e2e/support.js` answers every request whose pathname starts with `/api/v1` (works for both an absolute and a same-origin API base, with CORS/preflight handling for the absolute case), serves a local stub page for the Paystack authorization URL, passes our own dev server through, and aborts every other origin (Pendo, Google Identity Services, Sentry, Vercel, Cloudinary). No test ever contacts the real backend, a payment provider, or any credential. First-run dashboard tours are suppressed via their localStorage seen-flag (it is UI preference, not behavior under test), and seeded sessions carry a sessionStorage guard so hard navigations (the session-expiry redirect) cannot resurrect cleared tokens.

Covered journeys — 8 tests across 4 specs:

- **Auth** (`auth.e2e.js`): sign-in success landing in the platform admin shell with the documented login payload; sign-in failure showing the pre-auth 401 fallback copy; logout (POST → cleared session → sign-in + toast); session expiry (401 → refresh 401 → `clearSessionAndRedirect` → hard redirect + "Session expired" toast), triggered by the Users search's debounced query so the 401 source is deterministic.
- **Payment initiation** (`payment-initiation.e2e.js`): a seeded member on a mobile viewport opens a payment link, clicks Make Payment, and reaches `https://checkout.paystack.com/...` (stubbed) — asserting the `POST /payments/pay/payment-links/{id}` payload without a real charge.
- **Payment callback** (`payment-callback.e2e.js`): `POST /payments/callback/verify` settling into the success state and the FAILED error state, asserted admin-side where FAILED is terminal rather than the member screen's 30s re-poll.
- **Admin mutation** (`admin-mutation.e2e.js`): suspend-user confirmation modal (reason required) → `PATCH /admin/users/{id}/suspend` with the exact body → refetched row shows Suspended + success toast.

CI runs the suite in the existing workflow (`.github/workflows/ci.yml`): two extra steps — after `npm ci`, `npx playwright install --with-deps chromium` (Chromium only), and after `npm run test`, `npm run test:e2e`. No secrets, backend, database, or Paystack account are involved — every API call and the provider redirect are stubbed locally. Component/unit coverage (Vitest) remains part of the same CI gate.
