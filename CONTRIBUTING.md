# Contributing

## Code conventions

- Keep application code in JavaScript/JSX. Use the existing React and Vite patterns; do not introduce TypeScript requirements.
- Use PascalCase for React components, camelCase for functions and variables, and descriptive names for hooks beginning with `use`.
- Keep imports grouped by external packages, internal modules, and relative utilities when practical. Remove unused imports.
- Put backend request functions in `src/api/` and expose server state to components through React Query hooks.
- Handle loading, empty, success, validation, authorization, and request-error states explicitly. Use existing error helpers and notifications rather than exposing raw responses.

## Testing and checks

Add focused Vitest/Testing Library coverage for changed logic and user-visible states. Mock API modules at the boundary; never require production credentials. Before opening a PR, run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## Git workflow

Create a short-lived `feature/` or `chore/` branch from `main`. Open a pull request into `main` and wait for required CI checks before merging. Do not work directly on `main`. Keep commits small and use imperative conventional-commit subjects such as `feat:`, `fix:`, `chore:`, `ci:`, and `docs:`.

Keep PRs focused, describe the behavior and verification steps, and call out follow-up work or known testing gaps. Use the repository pull request template and preserve the existing Dependabot workflow.
