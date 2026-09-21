export function normalizePlatformRole(role) {
  return typeof role === "string" ? role.trim().toUpperCase() : "";
}

// Backend-verified platform roles (core.platform_roles seed): USER,
// SUPER_ADMIN, OPERATIONS_ADMIN, COMPLIANCE_ADMIN, SUPPORT_AGENT,
// READ_ONLY_ANALYST. Backend authorization is permission-based, and only
// the full-admin set below holds platform-wide administration permissions.
// Full admin-shell access is therefore an exact set match — never "anything
// other than USER". SUPPORT_AGENT and READ_ONLY_ANALYST are legitimate
// platform roles whose frontend destination is deferred product behavior;
// they fall back to the standard non-admin routing like USER. Missing or
// unknown roles fail closed so a malformed auth response cannot elevate a
// session accidentally.
const FULL_ADMIN_PLATFORM_ROLES = new Set(["SUPER_ADMIN", "OPERATIONS_ADMIN", "COMPLIANCE_ADMIN"]);

export function isPlatformAdminRole(role) {
  return FULL_ADMIN_PLATFORM_ROLES.has(normalizePlatformRole(role));
}
