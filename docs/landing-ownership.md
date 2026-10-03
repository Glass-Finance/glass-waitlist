# Landing ownership

**Status:** decided. This repo (`glass-waitlist`, `app.glasspay.app`) is the product. It is **not** the owner of the public marketing site.

## The decision

| Repo                         | Deploys to         | Owns                                                                              |
| ---------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `glass-waitlist-v1`          | `glasspay.app`     | **The public marketing site. Source of truth for all landing content.**           |
| `glass-waitlist` (this repo) | `app.glasspay.app` | Product: auth, onboarding, community-admin dashboard, member app, platform admin. |

`glasspay.app` is built and deployed **only** from `glass-waitlist-v1`. A landing change made here does not reach users and never will.

This corrects the previous documentation in this repo, which claimed this repo was the source of truth for landing components and described the other repo as a hand-ported copy. That was accurate when written and stopped being true some time ago: `glass-waitlist-v1` has since moved ahead on product demonstrations and on copy accuracy, so porting _from_ this repo would regress the live site.

## Deployment provenance

Verified 2026-09-25 against the GitHub deployments API and the live response headers:

| Fact                           | Value                                                                                                                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live `glasspay.app` built from | `glass-waitlist-v1` @ `c70d971676254625c0489c3f33632e2bbc20e671`                                                                                                                                                                                                                      |
| That SHA is                    | `glass-waitlist-v1` `origin/main` at the time of this decision — **in sync**                                                                                                                                                                                                          |
| Deployed at                    | 2026-09-25T14:47:19Z, Vercel environment `Production – glass-website`                                                                                                                                                                                                                 |
| Confirmed by                   | `last-modified: Fri, 25 Sep 2026 14:58:50 GMT`; live bundle contains the use-case carousel + Crisp markers introduced in `3fd7e1c` / `bb0f4b7`; live CSP `frame-ancestors` includes the Upwork allowlist (this repo's `vercel.json` uses `X-Frame-Options: DENY` and a different CSP) |

**Local checkouts were stale when this was measured** — the marketing working copy sat at `1d6d8b9` (7 commits behind) and this repo's `main` at `11740f3` (28 commits behind `origin/main`). Any drift figure computed from a stale checkout is wrong. Re-run the guard from current `origin/main` on both sides.

## What stays in this repo, deliberately

- **`LandingPageRedirect`** (`src/App.jsx`) — on `app.glasspay.app`, the landing paths hop to `MARKETING_ORIGIN`. A shared app-host link must still reach the marketing site. This is app-host routing, not landing content.
- **Legal pages** — `src/pages/legal/` and `src/components/legal/`. Routed in `App.jsx`, linked from sign-up (`/terms`), from the KYC privacy link (`useKycVerification.js`), and from emails. They must resolve on the app host no matter who owns the marketing pages.
- **Shared infrastructure with app-side importers** — verified by reference analysis, all have non-landing consumers and must not be treated as landing-owned: `common/CloudImage.jsx` (18 app importers), `ui/Button.jsx` (50), `common/LoadingState.jsx` (23), `ui/TextInput.jsx` (9), `common/EmptyState.jsx` (6), `common/BrandedSpinner.jsx` (2), `src/lib/cloudinary.js`, `src/utils/deviceRedirect.js`.

## Deprecated landing copy in this repo

Unmodified, unmaintained, guarded. See the table in the root `README.md`. They remain only so the previous implementation is readable and so `LandingPageRedirect` still has local routes to redirect from in dev.

**They have not been deleted.** Deletion is deliberately deferred to a separately reviewed step, because the reference analysis has to be re-run against whatever the tree looks like at that time. The guard treats deletion as a failure too, so it cannot happen as a side effect of a copy edit.

## The guard

`npm run check:landing-sync` → `scripts/check-landing-sync.mjs`, enforced in `.github/workflows/ci.yml` (the workflow checks out `glass-waitlist-v1` as a sibling so the guard always has it).

- **Guard (fails the build):** every file in `scripts/landing-deprecation.lock.json` must hash-match. Editing _or_ deleting one fails and names `glass-waitlist-v1` as the correct target. This directly blocks the failure mode this repo's old documentation invited: editing a landing component here and believing it shipped.
- **Report (never fails):** prints what marketing has that this repo does not, and which shared files differ, so the legacy delta stays visible.
- **Missing sibling:** in CI this is a **failure**. Locally it is a `SKIP` notice so a solo contributor without the marketing repo is not blocked. The previous version skipped in both cases, which is how the drift accumulated unnoticed.

Re-baseline only as a deliberate, reviewed change: `node scripts/check-landing-sync.mjs --update-lock`. Never to silence a real edit.

## Recorded drift at `origin/main` (2026-09-25)

Measured with both repos at their true `origin/main` (app `d2eb484`, marketing `c70d971`):

- **31** shared files differ (the earlier figure of 26/28 came from stale checkouts and a narrower file set).
- **19** files exist only in `glass-waitlist-v1`, including `PhoneHeroDemo.jsx`, `LaptopHeroDemo.jsx`, `OrganizationHowItWorks.jsx`, `MembersHowItWorksSection.jsx`, `PageGlow.jsx`, `Security.jsx`, `Reveal.jsx`, `TrueFocus.jsx`, `TextType.{jsx,css}`, the multi-screen dashboard tour (`DashboardScreen.jsx`, `PaymentsScreen.jsx`, `MembersScreen.jsx`, `TourCursor.jsx`), and three test files (`CloudImage.test.jsx`, `cloudinary.test.jsx`, `deviceRedirect.test.js`).
- `glass-waitlist-v1` also has newer _and corrected_ copy. Its `WhyGlass` already fixes two claims this repo still ships, and its `Security` softened an unsubstantiated licensing claim. **Porting this repo's version forward would reintroduce known-false marketing copy.**

`vercel.json` and `eslint.config.js` differ legitimately — the two deployments have different rewrites and header policies. They were in the old equality check and are not landing content; the new guard does not compare them.
