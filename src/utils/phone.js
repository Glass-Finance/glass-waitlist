// This field is a WhatsApp number, not a nationality check — Glass members
// aren't necessarily Nigerian, so this only validates a plausible phone
// number shape (optional leading +, 7-15 digits — the E.164 international
// max length), not any one country's specific format. Accepts spaces/
// dashes/parentheses since that's how people naturally type a number,
// stripping them before checking. Used by every registration form so a
// typo surfaces immediately instead of failing later when a reminder
// can't be delivered — the number must actually be WhatsApp-reachable.
export function isPhoneValid(phone) {
  const digits = (phone ?? "").replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(digits);
}

export const PHONE_FORMAT_HINT = "Enter a valid WhatsApp number, e.g. +234 803 123 4567.";
