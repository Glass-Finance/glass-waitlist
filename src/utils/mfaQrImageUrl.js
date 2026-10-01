// src/utils/mfaQrImageUrl.js
//
// Image-URL validation for the MFA enrolment QR code.
//
// WHY THIS EXISTS SEPARATELY FROM safeImageUrl
// ---------------------------------------------
// safeImageUrl rejects `data:` outright, and its own docblock says so
// deliberately:
//
//   "data: is rejected outright rather than narrowed to data:image/*. The call
//    sites all preview with URL.createObjectURL (blob:) … If one is ever
//    required, add a narrowly allowlisted data:image/(png|jpeg|webp|gif);base64,
//    branch explicitly rather than loosening this function."
//
// The MFA enrolment QR is that case: the backend may return the rendered code
// either as a remote image URL (`qrCodeImage`) or as an inline data URI
// (`qrCodeDataUri`). Both arrive as server-supplied strings and both land in an
// <img src>, so both need validating — but `safeImageUrl` alone would break
// every data-URI response and silently break MFA enrolment.
//
// So this follows the prescription exactly: ordinary URLs are handed to
// safeImageUrl unchanged (one policy, one place), and `data:` is permitted only
// for the four raster formats an authenticator QR can legitimately be, base64
// encoded, with nothing else. safeImageUrl itself is NOT modified — the
// existing, already-hardened components keep the stricter policy they have today.
//
// This is deliberately narrow. `data:image/svg+xml` is NOT allowed: SVG can
// carry script, and it is not a format this QR is ever served as.

import { safeImageUrl } from "./safeImageUrl";

/**
 * Raster formats an MFA QR image may legitimately use. Matches the set named in
 * safeImageUrl's docblock. Base64-only — a percent-encoded or plain-text
 * data: payload has no legitimate use here and is rejected.
 */
const DATA_IMAGE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;

/**
 * Validate a server-supplied MFA QR image value.
 *
 * Accepts ordinary web/blob/root-relative URLs (delegated to safeImageUrl) and
 * narrowly-allowlisted base64 raster data URIs.
 *
 * @param {unknown} value candidate QR image URL or data URI
 * @returns {string|null} the value when safe to render, else null
 */
export function safeMfaQrImageUrl(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Only a data: URI needs handling here; everything else — including the
  // rejection of javascript:/vbscript:/file:/ftp:/protocol-relative/control
  // characters — is safeImageUrl's job, unchanged.
  if (!trimmed.toLowerCase().startsWith("data:")) return safeImageUrl(trimmed);

  return DATA_IMAGE.test(trimmed) ? trimmed : null;
}

/**
 * Resolve the QR image to render from an MFA setup payload.
 *
 * Candidate order is preserved from the original expression —
 * `qrCodeImage ?? qrCodeDataUri ?? qrCodeUri` — but each candidate is validated
 * and the first SAFE one wins. Validating after a `??` chain would be wrong: a
 * present-but-malicious `qrCodeImage` would win on nullishness alone, and the
 * valid `qrCodeDataUri` behind it would never be reached.
 *
 * Extracted so the ordering/validation interaction is unit-testable without
 * mounting the whole enrolment screen.
 *
 * @param {{ qrCodeImage?: unknown, qrCodeDataUri?: unknown, qrCodeUri?: unknown } | null | undefined} setupData
 * @returns {string|null} a safe renderable value, or null when none qualifies
 */
export function resolveMfaQrImageSrc(setupData) {
  return (
    safeMfaQrImageUrl(setupData?.qrCodeImage) ??
    safeMfaQrImageUrl(setupData?.qrCodeDataUri) ??
    safeMfaQrImageUrl(setupData?.qrCodeUri) ??
    null
  );
}

export default safeMfaQrImageUrl;
