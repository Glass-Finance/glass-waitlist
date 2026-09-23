import * as Sentry from "@sentry/react";

// Same fallback pattern as GOOGLE_CLIENT_ID in main.jsx -- if the DSN isn't
// configured (local dev, or before ops sets one up), the app runs exactly
// as it does today with monitoring silently disabled, rather than crashing
// on a missing env var or reporting noise from every developer's laptop.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? "";

let enabled = false;

// 0..1 sampling of performance transactions once a DSN exists. Default 0.1
// so transaction/API traces actually show up after an incident instead of
// errors floating with zero timing context; set VITE_SENTRY_TRACES_SAMPLE_RATE=0
// for errors-only (the old behaviour).
function resolveTracesSampleRate() {
  const raw = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
  if (raw === undefined || raw === null || raw === "") return 0.1;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.1;
  return n;
}

export function initMonitoring() {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: resolveTracesSampleRate(),
  });
  enabled = true;
}

// True when a DSN was present at boot — lets health checks / smoke tests
// assert production isn't accidentally running blind.
export function isMonitoringEnabled() {
  return enabled;
}

// A routine 4xx (validation error, wrong password, "Active Default Account
// Required", etc.) is expected user-facing feedback, not a bug -- reporting
// every one of those would drown out the signal. Only report network
// failures (no response at all) and 5xx server errors, which are the cases
// where something actually broke.
function isWorthReporting(error) {
  const status = error?.response?.status;
  if (status === undefined) return true; // network error / no response
  return status >= 500;
}

// The single choke point every error in the app already flows through
// (mutationCache.onError -> notifyError, plus ad-hoc notifyError calls) --
// wiring in here gives crash visibility across the whole app without
// touching every call site individually.
/**
 * @param {any} error
 * @param {{ context?: string }} [opts]
 */
export function captureException(error, { context } = {}) {
  if (!enabled || !isWorthReporting(error)) return;
  Sentry.captureException(error, {
    tags: context ? { context } : undefined,
  });
}

// For render-time crashes caught by ErrorBoundary, which have a React
// componentStack instead of an HTTP response to filter on -- always worth
// reporting, since these are unconditionally real bugs.
export function captureRenderError(error, componentStack) {
  if (!enabled) return;
  Sentry.captureException(error, {
    contexts: { react: { componentStack } },
  });
}
