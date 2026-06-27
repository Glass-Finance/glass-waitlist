import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for turning ANY error (axios, network, JS) into a
// human-readable message. Every catch block in the app should go through
// getErrorMessage() / notifyError() instead of reaching for
// err.response?.data?.message directly, so behaviour stays consistent
// (and improves in one place) across registration, onboarding, payments,
// transactions, and every settings page on both desktop and mobile.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MESSAGES = {
  400: "That didn't look right — please check the form and try again.",
  401: "For your security, your session has expired — please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That already exists or conflicts with something else.",
  422: "Some of the information provided isn't valid.",
  429: "Too many attempts — please wait a moment and try again.",
  // 502/503/504 mean OUR server failed to get a valid response from
  // whatever it's calling internally (Paystack, most often, for anything
  // bank/payment related) — distinct from "we have a bug," so worth its
  // own message rather than the generic 500 fallback.
  502: "Our service is temporarily unavailable. Please try again in a moment.",
  503: "Our service is temporarily unavailable. Please try again in a moment.",
  504: "That took too long to respond. Please try again in a moment.",
};

function fallbackForStatus(status) {
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return "Something went wrong on our end. Please try again shortly.";
  return "Something went wrong. Please try again.";
}

// Some backends return { message }, some { error }, some a validation array
// under { errors: [{ field, message }] } or { errors: ["msg", ...] }.
function extractServerMessage(data) {
  if (!data) return null;
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (Array.isArray(data.errors) && data.errors.length) {
    const first = data.errors[0];
    return typeof first === "string" ? first : first?.message ?? null;
  }
  return null;
}

/**
 * Turn any thrown error into a single human-readable string.
 * Never throws, never returns empty.
 */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;

  // Axios error with a response from the server
  if (error.response) {
    const serverMessage = extractServerMessage(error.response.data);
    return serverMessage ?? fallbackForStatus(error.response.status);
  }

  // Axios error with no response — request never reached the server
  if (error.request) {
    return "Connection lost — this didn't go through. Check your connection and try again.";
  }

  // Axios/timeout-specific code
  if (error.code === "ECONNABORTED") {
    return "Request timed out — please try again.";
  }

  // Plain JS Error or anything else with a message
  if (typeof error.message === "string" && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Log (for debugging) + surface (toast) an error in one call.
 * Returns the message string so callers can still set inline form errors
 * with the exact same text the toast showed.
 *
 * Usage:
 *   try { ... } catch (err) { setError(notifyError(err)); }
 *   try { ... } catch (err) { notifyError(err, { context: "Creating community" }); }
 */
export function notifyError(error, { fallback, context, silent = false } = {}) {
  const message = getErrorMessage(error, fallback);

  if (import.meta.env?.DEV) {
    console.error(context ? `[${context}]` : "[error]", error);
  }

  if (!silent) {
    toast.error(message);
  }

  return message;
}

/**
 * Wraps an async action with consistent error handling + an optional
 * success toast. Returns true/false so callers can branch (e.g. close a
 * modal only on success) without re-handling the catch themselves.
 *
 * Usage:
 *   const ok = await runWithErrorHandling(
 *     () => initiatePayment.mutateAsync({...}),
 *     { context: "Initiating payment", successMessage: "Payment started" }
 *   );
 */
export async function runWithErrorHandling(action, { context, successMessage, fallback } = {}) {
  try {
    const result = await action();
    if (successMessage) toast.success(successMessage);
    return { ok: true, result };
  } catch (error) {
    const message = notifyError(error, { context, fallback });
    return { ok: false, error, message };
  }
}
