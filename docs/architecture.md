# Architecture

## Current architecture

Glass is a frontend-only React 19 single-page application built with Vite 8. React Router 7 owns client-side navigation. The application contains member-facing flows, community-admin dashboards, platform-admin routes, onboarding, and public landing pages.

The main boundaries are:

- `src/api/` contains Axios wrappers for backend resources.
- `src/hooks/` contains React Query hooks and reusable UI hooks.
- `src/store/` contains app-wide context, including authentication state.
- `src/routes/` contains authentication, role, community, and device guards.
- `src/layouts/`, `src/pages/`, and `src/components/` contain route shells and UI.
- `src/services/` contains API-adjacent workflows such as authentication.
- `src/utils/` contains pure helpers and domain formatting logic.

The browser calls a separate backend through `VITE_API_BASE_URL`; this repository does not provide a backend or local API emulator. React Query owns server-state caching and invalidation. Axios provides the shared HTTP client, auth headers, refresh handling, timeout, and response error handling.

## Proposed/future architecture

Future work may formalize feature boundaries around domain modules, introduce shared query-key factories, and add stronger integration tests around route transitions and API failure states. These are proposals, not current structure.
