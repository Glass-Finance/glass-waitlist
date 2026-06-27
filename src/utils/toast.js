import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Toast helpers, one per category. Plain toast.error()/notifyError() in
// errorHandler.js already cover generic errors — these are for the richer
// shapes: a reference number to verify later, a wait that needs ETA context,
// an alert that needs detail + a couple of clear actions, or a lower-stakes
// update with a timestamp. Styling (colors, borders, icons) lives in
// main.jsx's <Toaster> — these just pick the right sonner call and shape.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Success — minimal: a clear outcome, and a reference number where there's
 * something the user might want to verify later (a payment, a transfer).
 *   toastSuccess("Payment sent", { reference: "TXN-88213" })
 *   toastSuccess("Member added")
 */
export function toastSuccess(title, { description, reference, id } = {}) {
  return toast.success(title, {
    id,
    description: reference ? `Ref: ${reference}` : description,
  });
}

/**
 * Progress — a spinner plus contextual ETA copy, so a wait has a sense of
 * scale instead of feeling indefinite. Returns the toast id; resolve it by
 * calling toastSuccess/toastError with that same id, which morphs the same
 * toast in place rather than stacking a second one.
 *   const id = toastProgress("Adding members…", "Usually takes 5–10 seconds");
 *   ...
 *   toastSuccess("Members added", { id });
 */
export function toastProgress(title, etaText) {
  return toast.loading(title, { description: etaText, duration: Infinity });
}

/**
 * Warning/alert — the most critical type: needs enough detail to act on
 * without panic, and at most two ways to respond (primary + secondary).
 *   toastWarning("Unusual sign-in detected", {
 *     description: "New device · Lagos, Nigeria · 2 mins ago",
 *     primaryAction: { label: "This wasn't me", onClick: blockSession },
 *     secondaryAction: { label: "It's me", onClick: confirmSession },
 *   })
 */
export function toastWarning(title, { description, primaryAction, secondaryAction, duration } = {}) {
  return toast.warning(title, {
    description,
    duration: duration ?? 15000,
    action: primaryAction,
    cancel: secondaryAction,
  });
}

/**
 * Informational — lower-stakes updates (an incoming payment, an invite)
 * that read better with a relative timestamp for context.
 *   toastInfo("Jane Doe sent you ₦5,000", { timestamp: "2 mins ago" })
 */
export function toastInfo(title, { description, timestamp } = {}) {
  return toast.info(title, {
    description: [description, timestamp].filter(Boolean).join(" · "),
  });
}
