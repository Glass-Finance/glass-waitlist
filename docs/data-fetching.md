# Data Fetching

## Current architecture

API modules under `src/api/` expose Axios request functions. React Query hooks under `src/hooks/` call those functions and define query keys, enabled conditions, mutations, and invalidation. Components consume hook state rather than calling Axios directly in render logic.

The shared Axios client adds the API base path, JSON headers, timeout, access-token authorization, refresh handling, and session-expiry behavior. Query caches are cleared when a user logs in or logs out so one user's cached data is not reused by another session.

## Conventions

Use a resource-specific API wrapper, then a React Query hook for component-facing server state. Keep query keys stable and include identifiers that scope the data, such as community or resource IDs. Invalidate the smallest affected query families after mutations. Treat loading, empty, error, and success states as separate UI states.

## Proposed/future architecture

A shared query-key factory and typed API contract would reduce key drift and make cache invalidation easier to audit. This is future work; application code remains JavaScript/JSX for this sprint.
