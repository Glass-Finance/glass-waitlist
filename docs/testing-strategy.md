# Testing Strategy

## Current baseline

Vitest runs in a jsdom environment through `vite.config.js`. Testing Library is used for React components. Existing tests cover pure utilities, payment and recurring-schedule logic, React Query hooks, authentication-related pages, payment pages, admin components, and selected member flows.

Tests are colocated under `src/__tests__/` and use `*.test.js` or `*.test.jsx`. The suite is primarily unit and component-level; it does not replace manual verification against the real backend because this repository has no local backend or sandbox.

## Expectations

Add focused tests for changed pure logic, hook behavior, route guards, and user-visible error or loading states. Mock API modules at the boundary. Keep tests deterministic and independent of real credentials or production services. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before opening a PR.

## Gaps for later sprints

Priorities include broader route-guard coverage, API error-state coverage, auth refresh behavior, payment retry/idempotency behavior, and a small number of browser-level critical-path tests.
