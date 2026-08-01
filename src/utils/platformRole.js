export function normalizePlatformRole(role) {
  return typeof role === "string" ? role.trim().toUpperCase() : "";
}

// Platform roles are assigned by the backend. USER is the only regular
// account role; every other non-empty role grants platform-admin access.
// Missing roles fail closed so a malformed auth response cannot elevate a
// session accidentally.
export function isPlatformAdminRole(role) {
  const normalizedRole = normalizePlatformRole(role);
  return normalizedRole !== "" && normalizedRole !== "USER";
}
