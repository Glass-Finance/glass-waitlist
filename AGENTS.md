# AGENTS.md

Frontend-only Vite 8 + React 19 SPA (`src/main.jsx` → `src/App.jsx`): member app, community-admin dashboard, platform-admin panel, onboarding, and public landing pages. No backend, database, or migrations live here — the app talks to a separate Spring Boot API (`VITE_API_BASE_URL` + `/api/v1`, see `src/api/client.js`).

## Commands

```bash
npm install
cp .env.example .env   # then fill in VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID
npm run dev            # Vite dev server
```

Validate in CI order (`.github/workflows/ci.yml`) before opening a PR:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
```

Focused test: `npx vitest run src/__tests__/path/to.test.js` (suite runs `vitest run --pool=forks --maxWorkers=1`, jsdom). Tests live in `src/__tests__/` mirroring `src/`; mock API modules at the boundary, never require prod credentials.

```bash
npm run audit:endpoints                    # frontend calls vs the backend's real routes (OpenAPI)
npm run audit:endpoints -- --unconnected    # + backend routes nothing calls yet (roadmap view)
npm run audit:endpoints -- --strict         # non-zero exit on drift; runs advisory in CI
```

A call to a route the backend doesn't have type-checks, lints, builds and unit-tests clean, so nothing else catches it. Run this after touching anything in `src/api/`, and before claiming an endpoint is wired. `--unconnected` is the roadmap view; the script's `PENDING_BACKEND` list exists for routes whose 404 is deliberately tolerated, and every entry there owes a reason.

## Where things live

- `src/api/` — Axios resource modules. Components never call these directly; expose server state via React Query hooks in `src/hooks/`. See `docs/data-fetching.md`.
- `src/pages/` — route components (`auth/`, `onboarding/`, `dashboard/`, `memberApp/`). All route wiring + lazy loading in `src/App.jsx`.
- `src/routes/` — `ProtectedRoute`, `MemberProtectedRoute`, `MemberDeviceGuard`, `CommunityAdminGuard`, `PlatformAdminRoute`. Read these before touching routing. Guards are UX/access-routing only; backend permissions are authoritative.
- `src/services/` — auth payload builders + thin endpoint wrappers (`authPayloads.js`, `authService.js`). Build auth payloads with the builders; don't hand-roll request shapes.
- `src/store/AuthContext.jsx` — session source of truth. See `docs/authentication.md`.
- `docs/` — architecture, auth, authorization, payments, account/phone/KYC flows, data-fetching, error-handling, testing strategy, ADRs. Check the relevant file before inventing a pattern.
- **Sign-in accepts an email or phone number (one identifier field); phone is added later in Settings (copy = Add, not Verify)** — `docs/account-verification.md`.
- **KYC (Smile ID)** — `docs/kyc.md`.
- `docs/team-conventions.md` — human team working agreements (PR flow, ownership of coverage floors / ADRs / AGENTS.md, e2e mocking preferences, how to avoid parallel-infra collisions). Read when coordinating with other contributors.

## Rules agents violate most

- **Do not touch the session system without cause.** Single-flight refresh, cross-tab refresh lease, session-epoch invalidation, and rotation-reuse protection are load-bearing (`AuthContext.jsx`, `src/api/client.js`). A logout that wins a race must never be undone by an in-flight refresh.
- **401s have two escape hatches** (`src/api/client.js`): `PRE_AUTH_PATHS` (`/auth/login`, `/auth/google`, `/auth/mfa/totp/verify-login`) never trigger refresh/redirect — a 401 there means _wrong credentials_, not _session expired_, and `errorHandler.js` uses that copy. A request may set `{ _skipAuthRedirect: true }` to suppress `clearSessionAndRedirect()` and surface the error instead; the payment flow does exactly that because `/payment/callback` deliberately sits outside `ProtectedRoute` (`src/App.jsx`), where a hard navigation would destroy pending payment context. Session keys are cleared only through `clearSessionStorage()` — never hand-maintain a second key list. Refresh/session coordination itself is covered by the rule above.
- **Roles are exact backend codes, not keywords.** Platform admin shell ⟺ `SUPER_ADMIN`, `OPERATIONS_ADMIN`, `COMPLIANCE_ADMIN` (`isPlatformAdminRole`). Community dashboard ⟺ `owned === true` or `COMMUNITY_OWNER`/`COMMUNITY_ADMIN` (`isCommunityAdmin`). There is no `MANAGER` role. Unknown codes fail closed. Verified against the backend in `docs/authentication.md`.
- **Three admin gates — pick the right one.** `ProtectedRoute requiredRole="admin"` admits a platform admin **or** an admin of _at least one_ community — never describe it as proving only community-admin access. It says nothing about _which_ community, and client-controlled `?community=` selects it, so per-community pages must also be wrapped in `CommunityAdminGuard`. Genuinely platform-wide pages need `PlatformAdminRoute`. Never drop the inner guard: URL-editing `?community=B` must not expose another community's members, payments, or roles.
- **Member routes are user-agent gated; tablets count as desktop** (`MemberDeviceGuard` + `isMobileDevice`/`isMobileSession`, `src/utils/deviceRedirect.js`). `/member/join` is hard-gated, and member-app routes send non-phone visitors to the QR handoff (`/member/mobile-required`) instead of rendering responsively. Admin and onboarding routes are never device-gated.
- **Registration contract quirks (backend-verified):** `POST /auth/register` has no `confirmPassword` field; duplicate email returns **400**, never 409; `phoneRegion` is optional (defaults to `NG` server-side); `POST /auth/google` accepts only `{ clientToken }`, so Google sign-in during an invite flow falls back to manual acceptance on `/member/invites`. Never transmit the `?token=` invite value.
- **Two repos, two deploys:** this repo → `app.glasspay.app`; `glass-waitlist-v1` → `glasspay.app` (marketing). Landing components here are the source of truth but do **not** auto-sync — re-port changes or flag the drift in the PR. Cross-domain navigation goes through `goToApp()` (`src/utils/deviceRedirect.js`), never raw `navigate()`.
- **Payments:** verify endpoint is async (queues a job, returns current DB status, often `INITIATED`) — poll, don't treat the first response as final; a premature `FAILED` can later correct to `SUCCESSFUL`. Payment-status interpretation belongs in the centralized status module; don't scatter new literals. See `docs/payments.md` and `docs/decisions/ADR-004-payment-idempotency.md`.
- **Mutation toasts are global — don't add your own.** Every mutation's error already toasts from `MutationCache.onError` in `src/main.jsx`; opt out with `meta: { silentError: true }` when the hook renders its own inline error. Success toasts are opt-in via `meta: { successMessage }` (string or `(variables, data) => string`). A local `onError` — e.g. for optimistic rollback — still runs and does not suppress the global toast, so don't add a duplicate per-mutation error toast.
- **Inline `<script>` edits in `index.html`** invalidate a `sha256-` entry in `vercel.json`: run `npm run build`, then `node scripts/compute-csp-hashes.mjs`, and swap in the hash. Google Identity Services hashes come from live CSP reports, not that script — don't remove them.
- **JS-only app code** (`allowJs`, `checkJs: false`); Tailwind v4 CSS-first theme in `src/index.css` (no `tailwind.config.js`); fonts via `@fontsource` imports in `main.jsx`, never CSS `@import`.

## Workflow

Short-lived `feature/` branch → PR into `main` with the repo PR template (summary, test plan, checklist, screenshots for UI). Conventional-commit subjects. Never commit directly to `main`; keep dependency updates in their own PRs.
