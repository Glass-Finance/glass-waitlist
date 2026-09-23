# Testing Strategy

## Current baseline

Vitest runs in a jsdom environment through `vite.config.js`. Testing Library is used for React components. Existing tests cover pure utilities, payment and recurring-schedule logic, React Query hooks, authentication-related pages, payment pages, admin components, and selected member flows.

Tests are colocated under `src/__tests__/` and use `*.test.js` or `*.test.jsx`. The suite is primarily unit and component-level; it does not replace manual verification against the real backend because this repository has no local backend or sandbox.

## Type checking

`npm run typecheck` runs two passes: the original `tsc --noEmit` over `src`, plus `tsconfig.check.json` which enables `checkJs` for `src/utils`, `src/api`, and `src/lib` (the pure-logic core). When a directory is type-clean, widen the `include` in `tsconfig.check.json` to cover the next slice of the app.

## Accessibility lint

ESLint runs `eslint-plugin-jsx-a11y` recommended rules. Five rules with large pre-existing backlogs are currently disabled (`label-has-associated-control`, `click-events-have-key-events`, `no-static-element-interactions`, `no-autofocus`, `no-noninteractive-element-interactions` — 195 findings at time of writing). Re-enable them incrementally as the backlog is fixed; every other a11y rule is error-level.

## Coverage

`npm run test:coverage` enforces per-directory thresholds (see `vite.config.js` → `test.coverage.thresholds`). Floors are intentionally modest — raise them when adding tests, never lower them to make CI green.

## Expectations

Add focused tests for changed pure logic, hook behavior, route guards, and user-visible error or loading states. Mock API modules at the boundary. Keep tests deterministic and independent of real credentials or production services. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before opening a PR.

## End-to-end

Playwright lives under `e2e/` (`npm run test:e2e`), covering critical paths against a local Vite server with a mocked API (`page.route`) — no real backend or money. CI runs it as a separate job after the unit suite.

## Gaps for later sprints

- Same `idempotencyKey` twice → one charge **end-to-end** (client send/reuse is unit-tested; the live probe is `npm run probe:idempotency` and needs a real token — see `scripts/probe-payment-idempotency.mjs`).
- Broader route-guard coverage, API error-state coverage, auth refresh behavior.
- Re-enable the five disabled jsx-a11y rules as their backlog clears.
- Widen `tsconfig.check.json` `include` beyond utils/api/lib.
