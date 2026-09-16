# ADR-001: Use React Query for Server State

- Status: Accepted
- Date: 2026-09-10

## Context

The frontend reads and mutates remote community, member, payment, transaction, and notification data. Those resources need caching, loading/error state, and targeted invalidation.

## Decision

Use TanStack React Query 5 through hooks in `src/hooks/`. Keep Axios request functions in `src/api/` and keep server state out of the app-wide auth context unless it is session identity.

## Consequences

Components get consistent query state and mutations can invalidate related resources. Query keys and invalidation remain a maintenance responsibility. A future key factory is proposed in `docs/data-fetching.md`.
