# Contributing

## Deferred / On Hold

### CEO UX Fixes — held off

These items came out of a CEO review and are scoped but not yet implemented.
Enable them when prioritised.

#### 1. Settings navigation depth (dashboard)
The admin dashboard buries settings too many levels deep. The fix involves flattening the navigation so key settings (community profile, payout account, member access) are reachable in fewer clicks — likely by surfacing them as top-level sidebar items or a dedicated settings hub.

#### 2. Home / Upcoming Payments redundancy (member app)
The member app's **Home** and **Upcoming Payments** tabs show largely overlapping information. The fix is to consolidate them — either merge Upcoming Payments into Home as a section, or differentiate them clearly so each has a distinct purpose.

---

### Delete Community / Delete Account — shipped

Both flows are now live (previously held off waiting on backend endpoints):
- **Delete Community** — `src/pages/dashboard/settings/community/CommunityProfile.jsx`, calls `deleteCommunity` (`DELETE /api/v1/communities/{communityIdentifier}`) behind a type-the-community-name confirmation modal.
- **Delete Account** — `src/pages/dashboard/settings/account/Profile.jsx`, a two-step flow: type `DELETE` to confirm → `POST /api/v1/user/me/deletion/request-code` emails a verification code → entering it calls `deleteAccount(token)` (`DELETE /api/v1/user/me`, which anonymizes after a grace period).
