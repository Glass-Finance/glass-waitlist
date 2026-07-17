// Nigerian mobile numbers: 11 digits starting with 0 (e.g. 08031234567),
// or the +234 international form (234 followed by 10 digits, no leading 0).
// Accepts spaces/dashes in the input since that's how people naturally type
// a number, stripping them before checking. Used by every registration form
// so a typo surfaces immediately instead of failing later when a reminder
// can't be delivered — the phone number must be WhatsApp-linked for that.
export function isPhoneValid(phone) {
  const digits = (phone ?? "").replace(/[\s-]/g, "");
  return /^0\d{10}$/.test(digits) || /^\+?234\d{10}$/.test(digits);
}

export const PHONE_FORMAT_HINT = "Enter an 11-digit Nigerian number, e.g. 0803 123 4567.";
