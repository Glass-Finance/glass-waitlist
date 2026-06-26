// ─────────────────────────────────────────────────────────────────────────────
// Device detection for the member app's mobile-only gating.
//
// Tablets are treated as desktop — the member experience is phone-first,
// not just "narrow viewport," so a tablet shouldn't slip through a pure
// width check. User-agent sniffing is the primary signal; viewport width is
// a fallback for the rare case the UA can't be read.
// ─────────────────────────────────────────────────────────────────────────────

function getDeviceType() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

  if (ua) {
    const isTablet = /iPad|Tablet|(Android(?!.*Mobile))/i.test(ua);
    if (isTablet) return "tablet";
    const isMobile = /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry/i.test(ua);
    if (isMobile) return "mobile";
    return "desktop";
  }

  // No UA available — fall back to viewport width
  if (typeof window !== "undefined" && window.innerWidth < 768) return "mobile";
  return "desktop";
}

export function isMobileDevice() {
  return getDeviceType() === "mobile";
}

// Public production origin — used to build the absolute URL a QR code
// points to, since the phone scanning it isn't on the same dev/local origin.
const APP_ORIGIN = "https://glasspay.app";

// Builds the absolute URL for a path (with its query string preserved,
// e.g. an invite token) so a phone can open it directly after scanning.
export function buildMobileUrl(path) {
  return `${APP_ORIGIN}${path}`;
}

// Where to send the "mobile-required" screen so it can render a QR back to
// wherever the user was actually trying to go.
export function mobileRequiredPath(targetPath) {
  return `/member/mobile-required?to=${encodeURIComponent(targetPath)}`;
}
