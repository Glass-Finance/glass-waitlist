# Glass

Glass is a community finance platform — communities (schools, cooperatives, associations, etc.) collect and track dues, payment plans, and settlements, and their members pay and manage their own obligations. This repo is the frontend: a single Vite + React SPA covering the public site, member-facing app, community-admin dashboard, and platform admin panel.

> The repo is named `glass-waitlist` for historical reasons (it started as a landing page with a signup waitlist) — it's since grown into the full application.

## Tech stack

- **React 19** + **React Router 7** (SPA, client-side routing)
- **Vite 8** for dev/build (Rolldown-based bundler)
- **Tailwind CSS 4** (CSS-first config, no `tailwind.config.js`)
- **TanStack React Query 5** for server state (fetching, caching, mutations)
- **Axios** for HTTP, with an interceptor-based auth-refresh flow
- **Framer Motion / GSAP / OGL** for animation on the public marketing pages
- **ESLint 9** for linting

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

The app runs at `http://localhost:3000` by default (see `vite.config.js`).

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Origin of the backend API (e.g. `https://api.glasspay.app`). The client appends `/api/v1` itself. |
| `VITE_GOOGLE_CLIENT_ID` | Only for Google sign-in | OAuth 2.0 Web client ID from Google Cloud Console, used by the "Continue with Google" buttons on sign-up/sign-in. Add your dev origin (e.g. `http://localhost:3000`) under "Authorized JavaScript origins" for it to work locally. |
| `VITE_APP_URL` | No | Public origin of the app itself (e.g. `https://app.glasspay.app`), used to build cross-device links (the "open this on your phone" desktop-required flow). Falls back to `window.location.origin` if unset, so it's safe to skip in local dev. |

This repo is frontend-only — it talks to a separate backend service and does not run one itself.

### Backend access

There's no separate local/mock backend to stand up — `VITE_API_BASE_URL` points at the one real API (see `.env.example`), and there's currently no throwaway sandbox environment. That means:
- Signing up creates a real account against the real backend, and goes through real email verification.
- The owner-onboarding flow (`src/pages/onboarding`) lets a fresh signup create a community and become its admin without anyone's help. To see the *member* side of things (joining an existing community, paying dues), you'll want an invite/join link into a community that already has payment plans set up — ask an existing contributor for one rather than building that state up from scratch.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check-free production build to `dist/` |
| `npm run lint` | Run ESLint over the project |
| `npm run preview` | Serve the production build locally |

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

| Term | Meaning |
|---|---|
| **Community** | The top-level entity everything belongs to — a school, cooperative, association, etc. Has one or more admins/owners and many members. |
| **Member** | A user who belongs to a community and owes/pays money into it. A user can be a member of multiple communities, and an admin of some while just a paying member of others. |
| **Admin / Owner** | A member with management rights over a community (create payment plans, invite/remove members, view balances). "Paying admin" = an admin who also owes dues themselves, same as a regular member. |
| **Payment plan** | A recurring or one-time due a community sets up for its members (e.g. "Monthly Dues," "School Fees Support"). |
| **Obligation** | One instance of a member owing money against a payment plan (e.g. this month's installment). This is what actually has a due date and a paid/unpaid status. |
| **Payment link** | The underlying payable object created from a payment plan — obligations reference a payment link. |
| **Transaction** | A record of money actually moving — a completed, failed, or pending payment attempt. |
| **Authorisation** | A saved payment method (card) with consent to auto-charge for one or more plans — this is what powers Auto-Pay. |
| **Settlement** | The payout of collected funds from Glass to a community's bank account. |

## Contributing

There's no branch/PR process in place yet — contributors currently commit and push directly to `main`. If you're pushing changes, `git fetch` first and rebase onto any commits that landed since you last pulled, since more than one person may be working on `main` at the same time.

## Notes

- Tailwind v4 uses its CSS-first config — theme overrides live in `@theme` blocks in `src/index.css`, not in a `tailwind.config.js`.
- The community-admin dashboard (`src/pages/dashboard`) is the largest and most actively developed part of the app.
- There's currently no automated test suite (no `test` script, no test files) — verify changes by running the app and exercising the affected flow manually.
