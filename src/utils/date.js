// Converts a <input type="date"> value ("YYYY-MM-DD") into an ISO
// timestamp for sending to the backend as a plan's startAt/dueAt.
//
// `new Date("2026-07-07")` parses date-only strings as UTC midnight. That
// instant is already in the past the moment it's past midnight UTC —
// which is true for most of every day in every timezone — so selecting
// *today* as a start/due date almost always got rejected by a backend
// check like "startAt can't be in the past." Parsing in the browser's
// local timezone instead avoids the UTC-midnight mismatch, and clamping
// up to "now" when the resulting instant has already passed (i.e. the
// selected date is today) guarantees today always validates.
export function dateInputToIso(dateStr, { clampToNow = false } = {}) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const local = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (clampToNow && local.getTime() < Date.now()) {
    return new Date().toISOString();
  }
  return local.toISOString();
}

// Returns the last valid day of a given month/year (1-12), for validating
// billing-day input against the actually-selected month rather than a
// flat 1-31 or 1-28 range.
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
