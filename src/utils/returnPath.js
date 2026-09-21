/**
 * src/utils/returnPath.js
 *
 * Pure validator for frontend-held return paths (?return=, ?to=). Internal
 * destinations only — never external URLs. REJECTS (returns null, never
 * strips/sanitizes):
 * - non-strings, empty values
 * - control characters (U+0000-U+001F, U+007F) or embedded whitespace
 *   anywhere, including \n, \r, \t (leading/trailing trim is allowed)
 * - anything not starting with a single "/" (schemes like https:, //evil,
 *   backslashes, relative paths)
 * - traversal segments (..), including encoded forms (single AND double
 *   percent-decode passes)
 * - paths outside the allowlist
 *
 * Allowlist matching is on path-segment boundaries: "/member" and
 * "/member/…" match, but "/members-x" and "/memberevil" do not. Query
 * strings on legitimate paths are preserved. Callers fall back to their
 * role-based default when this returns null.
 */

// Paths any signed-in user may be sent back to.
const MEMBER_ROOTS = ["/member"];

// Paths that additionally require an admin/onboarding context. Passed
// explicitly by the caller (e.g. the admin sign-in route) so a member-app
// link can never bounce someone into the dashboard.
const ADMIN_ROOTS = ["/dashboard", "/onboarding", "/payment/callback"];

// Anything outside printable ASCII (controls, DEL, non-ASCII) plus the
// space character itself — embedded anywhere, leading/trailing trim aside.
const NON_PRINTABLE_ASCII = /[^!-~]/; // rejects controls, DEL, non-ASCII, embedded spaces

function hasTraversal(pathname) {
  return pathname.split("/").some((segment) => segment === "..");
}

function isBadDecodedForm(pathname) {
  let current = pathname;
  // Two decode passes: catches double-encoded payloads (%252f → %2f → /).
  for (let i = 0; i < 2; i += 1) {
    let decoded;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return true;
    }
    if (decoded === current) return false;
    if (
      decoded.startsWith("//") ||
      decoded.includes("\\") ||
      hasTraversal(decoded) ||
      NON_PRINTABLE_ASCII.test(decoded) ||
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded.replace(/^\/+/, ""))
    ) {
      return true;
    }
    current = decoded;
  }
  return false;
}

function matchesRoot(pathname, root) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function isSafeReturnPath(value, { allowAdminPaths = false } = {}) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Control characters or embedded whitespace anywhere — reject outright.
  if (NON_PRINTABLE_ASCII.test(trimmed)) return null;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;

  // Split off the query string before validating the path itself. The query
  // may legitimately contain encoded values; only the path is allowlisted.
  const queryIndex = trimmed.indexOf("?");
  const pathname = queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex);
  // A colon before any "/" would be a scheme (https:, javascript:).
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed.slice(1))) return null;
  if (hasTraversal(pathname)) return null;
  if (isBadDecodedForm(pathname)) return null;

  const roots = allowAdminPaths ? [...MEMBER_ROOTS, ...ADMIN_ROOTS] : MEMBER_ROOTS;
  const allowed = roots.some((root) => matchesRoot(pathname, root));
  return allowed ? trimmed : null;
}
