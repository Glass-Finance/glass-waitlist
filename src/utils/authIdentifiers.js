import { getEmailError } from "./validators";
import { isPhoneValid, PHONE_FORMAT_HINT } from "./phone";

// A single field doubles as email-or-phone -- the backend rejects both/
// neither, so there's exactly one identifier to resolve, not two fields to
// reconcile. "@" is the one unambiguous signal between the two formats.
export function parseIdentifier(value) {
  const trimmed = value.trim();
  return trimmed.includes("@") ? { email: trimmed.toLowerCase() } : { phoneNumber: trimmed };
}

export function validateIdentifier(value) {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email or phone number.";
  return trimmed.includes("@")
    ? getEmailError(trimmed)
    : isPhoneValid(trimmed)
      ? ""
      : PHONE_FORMAT_HINT;
}
