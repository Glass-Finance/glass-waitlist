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

### Delete Community / Delete Account — held off

Confirmation modals and API calls are fully implemented in:
- `src/pages/dashboard/settings/community/CommunityProfile.jsx`
- `src/pages/dashboard/settings/account/Profile.jsx`
- `src/api/communities.js` (`deleteCommunity`)
- `src/api/members.js` (`deleteAccount`)

The buttons are disabled because the backend does not yet expose these endpoints:
- `DELETE /api/v1/communities/{communityIdentifier}`
- `DELETE /api/v1/user/me`

To enable: remove `disabled` from the Delete buttons in both settings pages once the backend ships the endpoints.
