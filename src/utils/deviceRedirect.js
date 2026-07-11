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

// Once MemberDeviceGuard has let someone through as mobile, remember that
// for the rest of this browser tab. Real phones never need this -- their
// UA is identical on every reload. It exists because device-emulation
// tools (Chrome DevTools' device toolbar) don't always reapply their UA
// override on a hard reload the same way they do on first load, which
// would otherwise bounce an already-in-progress mobile session to the QR
// handoff screen on every refresh.
const MOBILE_SESSION_KEY = "glass_mobile_verified";

export function isMobileSession() {
  if (isMobileDevice()) {
    try {
      sessionStorage.setItem(MOBILE_SESSION_KEY, "1");
    } catch {
      /* ignore — storage unavailable, fall through to the live check only */
    }
    return true;
  }
  try {
    return sessionStorage.getItem(MOBILE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

// Public origin for the app. VITE_APP_URL pins this to the production
// domain in deployed builds; in local dev it falls back to whatever
// origin Vite is serving on (http://localhost:5173), so invite links
// copied during development actually resolve instead of going to a
// hardcoded domain that may not be live.
export const APP_ORIGIN =
  import.meta.env.VITE_APP_URL ?? window.location.origin;

// ── Marketing / app domain separation ────────────────────────────────────────
// glasspay.app + www serve the marketing site only; the application lives on
// APP_ORIGIN (app.glasspay.app in production). Everything below no-ops in
// local dev and on the app domain itself, where APP_ORIGIN resolves to the
// current origin — so single-domain deployments keep working unchanged
// until VITE_APP_URL points somewhere else.
const MARKETING_HOSTS = new Set(["glasspay.app", "www.glasspay.app"]);

function isAppOriginSeparate() {
  try {
    return new URL(APP_ORIGIN).origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function isMarketingHost() {
  return MARKETING_HOSTS.has(window.location.hostname) && isAppOriginSeparate();
}

// Navigate to an app path: a hard hop to APP_ORIGIN from the marketing
// domain, ordinary SPA navigation everywhere else.
export function goToApp(path, navigate) {
  if (isMarketingHost()) {
    window.location.href = `${APP_ORIGIN}${path}`;
    return;
  }
  navigate(path);
}

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

// Mirror of mobileRequiredPath, for the opposite direction: the owner-
// onboarding flow (ChoosePath, OrganizationProfile, etc.) is desktop-only
// and non-responsive, so a mobile visitor gets sent here instead of a
// broken fixed-width layout.
export function desktopRequiredPath(targetPath) {
  return `/onboarding/desktop-required?to=${encodeURIComponent(targetPath)}`;
}
