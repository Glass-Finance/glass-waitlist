# ADR-003: Feature Architecture

- Status: Accepted
- Date: 2026-09-10

## Context

The application contains public pages, auth, onboarding, member flows, community-admin dashboards, and platform-admin tools. Shared APIs, hooks, layouts, and utilities need predictable ownership.

## Decision

Keep the existing layered structure: API wrappers in `src/api/`, server-state hooks in `src/hooks/`, cross-cutting services in `src/services/`, app context in `src/store/`, guards in `src/routes/`, and route/UI code in `src/pages/`, `src/layouts/`, and `src/components/`. Preserve JavaScript/JSX.

## Consequences

The structure matches the current codebase and limits broad rewrites. Domain-specific folders may be introduced when they clarify ownership, but moving files is not required for Sprint 1.
