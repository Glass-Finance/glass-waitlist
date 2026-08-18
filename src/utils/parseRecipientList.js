// Splits a free-typed, comma/newline-separated block of emails or user IDs
// into a clean list -- used by the admin "Send Notification" recipient
// field so the parsed count can be shown before anything is actually sent.
export function parseRecipientList(input) {
  return (input ?? "")
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
