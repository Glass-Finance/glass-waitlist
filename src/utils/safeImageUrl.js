/**
 * src/utils/safeImageUrl.js
 *
 * Pure validator for image URLs that are about to be bound to a DOM URL sink
 * (`<img src>`). These values are NOT all locally generated — several come
 * straight from the API (`/user/me` -> `profileImage.url`, the community
 * payload's `logo.url` / `logoUrl`), so the URL scheme is attacker-influenced
 * if an upload path, a community profile, or a compromised/misconfigured
 * backend can be talked into storing one. A `javascript:` URL in an `<img src>`
 * is the DOM-XSS sink CodeQL flags as `js/xss-through-dom`.
 *
 * REJECTS (returns null, never strips or rewrites):
 * - non-strings, null/undefined, empty/whitespace-only values
 * - ASCII control characters anywhere (U+0000-U+001F, U+007F) — these let a
 *   value smuggle a scheme past a naive parser, e.g. "java\tscript:alert(1)"
 * - anything whose scheme is not on the allowlist below. That covers
 *   javascript:, vbscript:, data: (including data:text/html), file:, ftp:,
 *   and any unknown/typo'd scheme
 * - protocol-relative values ("//host/path"), which silently adopt whatever
 *   scheme the page is served over
 * - scheme-relative and bare values with no scheme at all ("images/x.png")
 *
 * ACCEPTS:
 * - https: and http: — every remote image the app actually serves, including
 *   Cloudinary's res.cloudinary.com delivery URLs
 * - blob: — the local previews this app creates via URL.createObjectURL()
 *   immediately after a file is picked, in all four of the call sites that use
 *   this helper. These are same-origin, browser-minted, and cannot be forged
 *   by a server response.
 * - root-relative paths ("/…") — same-origin by definition and therefore not a
 *   scheme-injection vector. Allowed so a backend that ever returns a relative
 *   asset path degrades to a working image instead of a silently blank one.
 *
 * data: is rejected outright rather than narrowed to data:image/*. The call
 * sites all preview with URL.createObjectURL (blob:), so there is no
 * demonstrated legitimate need for a data: image here. If one is ever required,
 * add a narrowly allowlisted data:image/(png|jpeg|webp|gif);base64, branch
 * explicitly rather than loosening this function.
 *
 * Mirrors src/utils/returnPath.js: pure, same reject-don't-repair posture,
 * null on failure so callers can fall back in JSX.
 */

// Scheme per RFC 3986: ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

// Control characters only — NOT plain spaces, which can legitimately appear
// (unencoded) inside a query string and are handled by the browser.
// Written as a charCode scan rather than a /[\u0000-\u001F\u007F]/ literal:
// the repo lints no-control-regex, and an eslint-disable would be noise here.
function hasControlChar(value) {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

const ALLOWED_SCHEMES = new Set(["https:", "http:", "blob:"]);

/**
 * @param {unknown} value candidate image URL
 * @returns {string|null} the trimmed URL when its scheme is safe, else null
 */
export function safeImageUrl(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (hasControlChar(trimmed)) return null;

  // Protocol-relative: "//evil.example/x.png" adopts the page's scheme and
  // escapes the origin. Reject before the root-relative check below.
  if (trimmed.startsWith("//")) return null;

  // Root-relative, same-origin. No scheme to validate.
  if (trimmed.startsWith("/")) return trimmed;

  // No scheme at all ("images/x.png") — not an absolute URL, and accepting it
  // would mean guessing a scheme for the browser.
  const match = SCHEME.exec(trimmed);
  if (!match) return null;

  if (!ALLOWED_SCHEMES.has(`${match[1].toLowerCase()}:`)) return null;

  return trimmed;
}

export default safeImageUrl;
