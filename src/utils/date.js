// Converts a <input type="date"> value ("YYYY-MM-DD") into an ISO
// timestamp for sending to the backend as a plan's startAt/dueAt/endAt.
//
// `new Date("2026-07-07")` parses date-only strings as UTC midnight. That
// instant is already in the past the moment it's past midnight UTC —
// which is true for most of every day in every timezone — so selecting
// *today* as a start/due date almost always got rejected by a backend
// check like "startAt can't be in the past." Parsing in the browser's
// local timezone instead avoids the UTC-midnight mismatch.
//
// clampToNow: bump a today-that-parsed-as-past up to (just after) the
// current instant. Right for startAt ("starts now" is the correct meaning
// of picking today). Sending the *exact* instant read by the browser is
// itself a race against the backend's own clock, though: by the time the
// request is received and validated, the server's own "now" has moved on
// (network latency, processing time), so a startAt captured a moment
// earlier reads as already in the past and the whole request is rejected
// with "Start date cannot be in the past" — reliably, not as a rare edge
// case, since that gap exists on every single request. A small forward
// buffer, imperceptible to a human picking "today," absorbs it.
//
// endOfDayIfToday: for deadline-style fields (dueAt/endAt), a due date of
// "today" means "through the end of today," not "at this exact second" —
// pushing it to 23:59:59.999 local both matches that meaning and puts it
// safely in the future for the rest of the day, sidestepping the same race
// without needing the buffer.
const NOW_CLAMP_BUFFER_MS = 2 * 60 * 1000; // 2 minutes

export function dateInputToIso(dateStr, { clampToNow = false, endOfDayIfToday = false } = {}) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (endOfDayIfToday) {
    const now = new Date();
    const isToday =
      year === now.getFullYear() && month - 1 === now.getMonth() && day === now.getDate();
    if (isToday) {
      return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
    }
  }
  const local = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (clampToNow && local.getTime() < Date.now()) {
    return new Date(Date.now() + NOW_CLAMP_BUFFER_MS).toISOString();
  }
  return local.toISOString();
}

// Returns the last valid day of a given month/year (1-12), for validating
// billing-day input against the actually-selected month rather than a
// flat 1-31 or 1-28 range.
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
