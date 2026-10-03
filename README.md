# Glass

Glass is a community finance platform — communities (schools, cooperatives, associations, etc.) collect and track dues, payment plans, and settlements, and their members pay and manage their own obligations. This repo is the frontend: a Vite + React SPA covering the member-facing app, community-admin dashboard, and platform admin panel — deployed at **app.glasspay.app**.

> The repo is named `glass-waitlist` for historical reasons (it started as a landing page with a signup waitlist) — it's since grown into the full application.

## Two-repo setup — landing ownership (decided; read before touching landing components)

There are **two separate repos and two separate Vercel deployments**, and ownership of the public marketing site is now settled:

| Repo                                                                      | Deploys to         | Owns                                                                    |
| ------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| [`glass-waitlist-v1`](https://github.com/Glass-Finance/glass-waitlist-v1) | `glasspay.app`     | **The public marketing site. Source of truth for all landing content.** |
| `glass-waitlist` (this repo)                                              | `app.glasspay.app` | The product — auth, onboarding, dashboards, member app, platform admin. |

**Landing changes go in `glass-waitlist-v1`, not here.** `glasspay.app` is built and deployed only from that repo, so a landing edit made in this repo does not reach users and never will. This repo keeps a **deprecated, non-authoritative copy** of the landing pages purely as a historical reference; it is not maintained and is not a starting point for new work.

### The deprecated copy in this repo

- `src/pages/OrganizationsHome.jsx`, `src/pages/MembersHome.jsx`
- `src/components/organizations/`, `src/components/members/`, `src/components/howItWorks/`
- `src/components/Navbar.jsx`, `Footer.jsx`, `UseCases.jsx`, `TrustedBy.jsx`, `WhyGlass.jsx`, `SecurityFeatures.jsx`
- `src/components/ui/BlurText.jsx`, `src/components/ui/VariableProximity.jsx` (+ `.css`)
- `src/hooks/useScrollReveal.js`, `src/hooks/useSeoMeta.js`

**Do not edit any of these.** `npm run check:landing-sync` is a CI-enforced guard that fails the build if any of them changes, because this repo previously documented itself as their source of truth and that is no longer true. It has already drifted substantially from the live site (see `docs/landing-ownership.md` for the recorded reconciliation state). To change landing content, open a PR against `glass-waitlist-v1`.

### What deliberately stays in this repo

- **`LandingPageRedirect`** (`src/App.jsx`) — on `app.glasspay.app` the landing paths `/`, `/members`, and the legal paths hop to `MARKETING_ORIGIN` so a shared app-host link still reaches the marketing site. This is a routing concern of the app host, not landing content; keep it.
- **The legal pages** (`src/pages/legal/`, `src/components/legal/`) — routed in `App.jsx` and linked from in-app surfaces (sign-up `/terms`, KYC privacy link) and from emails, so they must resolve on the app host regardless of which repo owns the marketing pages.
- **Shared infrastructure the app genuinely uses** — `src/components/common/CloudImage.jsx`, `lib/cloudinary.js`, `ui/Button.jsx`, `ui/TextInput.jsx`, `common/LoadingState.jsx`, `common/EmptyState.jsx`, `common/BrandedSpinner.jsx`, and `src/utils/deviceRedirect.js`. These have app-side importers and are not landing-owned.

### Porting direction (informational)

The copy in this repo is **behind** `glass-waitlist-v1`, which has newer product demos and corrected copy. Do not port this repo's version forward — port `glass-waitlist-v1` → live. `check:landing-sync` reports the delta so it stays visible without failing on the known legacy difference.

## Tech stack

- **React 19** + **React Router 7** (SPA, client-side routing)
- **Vite 8** for dev/build (Rolldown-based bundler)
- **Tailwind CSS 4** (CSS-first config, no `tailwind.config.js`)
- **TanStack React Query 5** for server state (fetching, caching, mutations)
- **Axios** for HTTP, with an interceptor-based auth-refresh flow (session lifecycle, role contracts, and auth payload notes live in `docs/authentication.md`)
- **Motion** (`motion`) for animation — `BlurText`, scroll-linked reveals, and the dashboard-overlay demo, all confined to the deprecated landing copy in this repo
- **ESLint 9** for linting
- **Vitest** for unit tests (jsdom environment), run in CI on every push/PR
- **Sentry** for crash/error reporting, gated behind an optional env var (disabled unless configured)
- **Cloudinary** for all image delivery across the public landing pages and auth screens. URL-building lives in `src/lib/cloudinary.js` — see the environment variable below and the build guard in `scripts/check-build-env.mjs`.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

The app runs at `http://localhost:3000` by default (see `vite.config.js`).

### Environment variables

| Variable                          | Required                | Purpose                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`               | Yes                     | Origin of the backend API (e.g. `https://api.glasspay.app`). The client appends `/api/v1` itself.                                                                                                                                                                                                                                                                                                    |
| `VITE_CLOUDINARY_CLOUD_NAME`      | Yes                     | Cloudinary cloud name for image delivery (e.g. `ece5jmhy`). Required at **build time** — `import.meta.env.VITE_*` values are inlined by Vite, so if it's missing every image URL compiles to `res.cloudinary.com/undefined/...` and the site renders blank. `scripts/check-build-env.mjs` runs before `npm run build` and fails the build if it's absent (CI sets it in `.github/workflows/ci.yml`). |
| `VITE_TEST_MODE`                  | Yes                     | Explicit money-mode switch: the literal string `"true"` (Paystack test-card banner) or `"false"` (live keys). **Fail-closed** — the build refuses to run if unset, because unset used to mean live money. Set it in `.env`, Vercel project env vars, and CI.                                                                                                                                         |
| `VITE_GOOGLE_CLIENT_ID`           | Only for Google sign-in | OAuth 2.0 Web client ID from Google Cloud Console, used by the "Continue with Google" buttons on sign-up/sign-in. Add your dev origin (e.g. `http://localhost:3000`) under "Authorized JavaScript origins" for it to work locally.                                                                                                                                                                   |
| `VITE_APP_URL`                    | No                      | Public origin of the app itself (e.g. `https://app.glasspay.app`), used to build cross-device links (the "open this on your phone" desktop-required flow). Falls back to `window.location.origin` if unset, so it's safe to skip in local dev.                                                                                                                                                       |
| `VITE_CRISP_WEBSITE_ID`           | No                      | Website ID for the Crisp live-chat widget (from app.crisp.chat), read by `src/components/common/CrispChat.jsx`. Set it in Vercel for **Production, Preview, and Development** — an unset value simply disables chat (fail-closed). The backend owner holds the ID. See `.env.example`.                                                                                                               |
| `VITE_SENTRY_DSN`                 | Prod: effectively yes   | Enables crash/error reporting (`src/utils/monitoring.js`) via Sentry. Leave unset to run with monitoring disabled — the default for local dev, but **production without it is blind**.                                                                                                                                                                                                               |
| `VITE_SENTRY_TRACES_SAMPLE_RATE`  | No                      | 0..1 performance sampling once the DSN is set. Defaults to `0.1`; set `0` for errors-only.                                                                                                                                                                                                                                                                                                           |
| `VITE_FLAGS`                      | No                      | JSON feature/kill-switch map, e.g. `{"paymentsDisabled":true}` blocks every payment-initiation button after a redeploy; `{"kycDisabled":true}` hides member identity-verification entry points. See `docs/runbooks/incident-rollback.md`.                                                                                                                                                            |
| `VITE_SMILE_ENV` / `VITE_SMILE_*` | No                      | Smile ID Biometric KYC browser SDK config only (partner id, name, logo, policy URL, theme). The capture token is minted by the backend — never put secrets here. See `docs/kyc.md` and `.env.example`.                                                                                                                                                                                               |

This repo is frontend-only — it talks to a separate backend service and does not run one itself.

### Backend access

There's no separate local/mock backend to stand up — `VITE_API_BASE_URL` points at the one real API (see `.env.example`), and there's currently no throwaway sandbox environment. That means:

- Signing up creates a real account against the real backend, and goes through real email verification.
- The owner-onboarding flow (`src/pages/onboarding`) lets a fresh signup create a community and become its admin without anyone's help. To see the _member_ side of things (joining an existing community, paying dues), you'll want an invite/join link into a community that already has payment plans set up — ask an existing contributor for one rather than building that state up from scratch.

## Scripts

| Command                      | Description                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                | Start the Vite dev server                                                                                                                                                                                |
| `npm run build`              | Production build to `dist/` — runs `scripts/check-build-env.mjs` first and fails if required env vars (e.g. `VITE_TEST_MODE`) are missing or ambiguous                                                   |
| `npm run lint`               | Run ESLint over the project (includes jsx-a11y)                                                                                                                                                          |
| `npm run typecheck`          | `tsc` over `src` plus a `checkJs` pass over `src/utils`, `src/api`, `src/lib` (`tsconfig.check.json`)                                                                                                    |
| `npm run format`             | Format supported source, configuration, and documentation files                                                                                                                                          |
| `npm run format:check`       | Verify formatting without changing files                                                                                                                                                                 |
| `npm run test`               | Run the Vitest suite once (also runs in CI)                                                                                                                                                              |
| `npm run test:coverage`      | Vitest with coverage thresholds (regression gates — see `docs/testing-strategy.md`)                                                                                                                      |
| `npm run test:watch`         | Run Vitest in watch mode                                                                                                                                                                                 |
| `npm run test:e2e`           | Playwright E2E against a local dev server with a fully mocked API (`e2e/`) — also a separate CI job                                                                                                      |
| `npm run probe:idempotency`  | Live double-charge probe against the real API (needs `GLASSPAY_TOKEN` + `GLASSPAY_PAYMENT_LINK`)                                                                                                         |
| `npm run check:landing-sync` | CI-enforced guard: fails if any **deprecated** landing file in this repo is edited, since `glass-waitlist-v1` owns `glasspay.app`. Also prints the current drift delta. See `docs/landing-ownership.md`. |
| `npm run preview`            | Serve the production build locally                                                                                                                                                                       |

## Project structure

```
src/
├── api/          # Axios-based API client + one module per backend resource
├── components/   # Shared UI components (dashboard chrome, org-site sections, etc.)
├── hooks/        # React Query hooks wrapping the api/ layer
├── layouts/       # Route-level layout shells (e.g. DashboardLayout)
├── pages/        # Route components
│   ├── auth/         # Sign in / sign up / verification
│   ├── onboarding/   # Owner onboarding (create/choose a community)
│   ├── dashboard/    # Community-admin dashboard + platform admin panel
│   └── memberApp/    # Member-facing mobile-first app
├── routes/       # Route guards (auth, device, role)
├── services/     # Non-React-Query API-adjacent logic (e.g. auth)
├── store/        # App-wide context (auth, etc.)
└── utils/        # Small shared helpers
```

## Domain glossary

The codebase uses a handful of domain terms consistently — worth knowing before diving in:

| Term               | Meaning                                                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Community**      | The top-level entity everything belongs to — a school, cooperative, association, etc. Has one or more admins/owners and many members.                                                                                  |
| **Member**         | A user who belongs to a community and owes/pays money into it. A user can be a member of multiple communities, and an admin of some while just a paying member of others.                                              |
| **Admin / Owner**  | A member with management rights over a community (create payment plans, invite/remove members, view balances). "Paying admin" = an admin who also owes dues themselves, same as a regular member.                      |
| **Payment plan**   | A recurring or one-time due a community sets up for its members (e.g. "Monthly Dues," "School Fees Support").                                                                                                          |
| **Obligation**     | One instance of a member owing money against a payment plan (e.g. this month's installment). This is what actually has a due date and a paid/unpaid status.                                                            |
| **Payment link**   | The underlying payable object created from a payment plan — obligations reference a payment link.                                                                                                                      |
| **Transaction**    | A record of money actually moving — a completed, failed, or pending payment attempt.                                                                                                                                   |
| **Authorisation**  | A saved payment method (card) with consent to auto-charge for one or more plans — this is what powers Auto-Pay.                                                                                                        |
| **Settlement**     | The payout of collected funds from Glass to a community's bank account.                                                                                                                                                |
| **Reconciliation** | Platform-admin process matching internal ledger records against gateway settlements to surface discrepancies ("findings") for review/resolution — see the Settlements/Reconciliation tabs in the platform admin panel. |
| **KYC**            | Identity verification (Smile ID biometric) required before creating/managing communities — see `docs/kyc.md`.                                                                                                          |

## Auth and account flows (summary)

- **Sign-in accepts an email or phone number** in one identifier field (password or one-time code).
- **Phone is optional** and **added later** in Settings (home/Profile/dashboard nudges say **Add**, not Verify, until the number is verified).
- **Identity verification (KYC)** gates community create/manage and lives under member Settings → Identity Verification plus a platform-admin KYC queue.

Full write-up: [`docs/account-verification.md`](docs/account-verification.md). Session and backend contracts: [`docs/authentication.md`](docs/authentication.md). KYC: [`docs/kyc.md`](docs/kyc.md).

## Contributing

Use a short-lived `feature/` or `chore/` branch and open a pull request into `main`. CI (`.github/workflows/ci.yml`) runs formatting, lint, typecheck, tests, and the production build for pushes and pull requests targeting `main`; merge only after the checks pass. Branch-protection enforcement is a repository settings responsibility. Do not do feature work directly on `main`.

Before starting work, fetch and rebase onto the latest `main` when appropriate. The repository includes a pull request template and Dependabot configuration; keep dependency updates in their own reviewable pull requests.

## Notes

- Tailwind v4 uses its CSS-first config — theme overrides live in `@theme` blocks in `src/index.css`, not in a `tailwind.config.js`.
- The community-admin dashboard (`src/pages/dashboard`) is the largest and most actively developed part of the app.
- Unit tests (`npm run test`) cover the highest-risk pure logic — payment/obligation status resolution, formatting helpers, role matching, recurring-schedule math — under `src/__tests__/`, mirroring the `src/` tree it covers (see `docs/testing-strategy.md`). Most UI/flow changes still need manual verification by running the app; the suite isn't (yet) a substitute for exercising the affected flow.
