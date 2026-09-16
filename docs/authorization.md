# Authorization

## Current behavior

Client-side authorization is route-based and is implemented by guards under `src/routes/`. `ProtectedRoute` requires an authenticated token and can require an admin or member role. Community-admin and platform-admin checks are separate guards. The auth context derives admin access from the authenticated platform role or community membership data.

Individual pages and hooks also scope requests using the active community identifier. The backend remains the authority for permissions and resource access; the frontend guards are navigation and user-experience controls, not a security boundary.

The repository does not verify backend permission policy in this frontend. API responses such as `401` and `403` are handled as request errors and should be tested at the affected UI boundary.

## Proposed/future direction

Centralize permission names and route requirements in a small documented policy map, then add integration coverage for representative member, community-admin, and platform-admin journeys. Backend authorization must remain authoritative.
