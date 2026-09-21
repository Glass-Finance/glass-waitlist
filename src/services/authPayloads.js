/**
 * src/services/authPayloads.js
 *
 * Thin, pure builders for authentication request payloads. Shapes mirror the
 * backend request DTOs exactly (see glass-backend
 * model/request/RegisterRequest.java, ResetPasswordRequest.java,
 * UpdatePasswordRequest.java):
 *
 * - RegisterRequest: firstName, lastName, email, password, optional
 *   phoneNumber (+ required phoneConfirmToken when present), optional
 *   phoneRegion. No confirmPassword, no inviteToken, no role/community.
 * - ResetPasswordRequest: identifier + token + newPassword + confirmPassword
 *   (all required server-side, equality enforced server-side).
 * - UpdatePasswordRequest (PATCH /user/password): oldPassword +
 *   newPassword + confirmPassword (all required server-side).
 *
 * Identifier shape ({ email } XOR { phoneNumber, phoneRegion? }) is shared.
 * Builders include optional fields only when truthy, so omitting an
 * optional is identical on the wire to never having collected it.
 * phoneRegion stays optional: backend accepts ISO 3166-1 two-letter codes
 * and defaults to NG; E.164 inputs need no region.
 */

/**
 * Builds the { email } or { phoneNumber, phoneRegion? } identifier shape the
 * backend's auth endpoints require — exactly one, since the backend rejects
 * both/neither.
 */
export function identifierPayload({ email, phoneNumber, phoneRegion } = {}) {
  if (email) return { email };
  const identifier = { phoneNumber };
  if (phoneRegion) identifier.phoneRegion = phoneRegion;
  return identifier;
}

/**
 * Registration payload. confirmPassword and inviteToken are intentionally
 * absent: the backend RegisterRequest has neither field. phoneConfirmToken
 * is included exactly when a verified phone number is present (backend
 * requires it in that case, rejects nothing otherwise).
 */
export function buildRegisterPayload({
  email,
  firstName,
  lastName,
  password,
  phoneNumber,
  phoneConfirmToken,
  phoneRegion,
} = {}) {
  const payload = { email, firstName, lastName, password };
  if (phoneNumber) {
    payload.phoneNumber = phoneNumber;
    payload.phoneConfirmToken = phoneConfirmToken;
  }
  if (phoneRegion) payload.phoneRegion = phoneRegion;
  return payload;
}

/** Password-reset payload — confirmPassword is required server-side. */
export function buildPasswordResetPayload({
  email,
  phoneNumber,
  phoneRegion,
  token,
  newPassword,
  confirmPassword,
} = {}) {
  return {
    ...identifierPayload({ email, phoneNumber, phoneRegion }),
    token,
    newPassword,
    confirmPassword,
  };
}

/** Authenticated password-update payload — all three fields required. */
export function buildPasswordUpdatePayload({ oldPassword, newPassword, confirmPassword } = {}) {
  return { oldPassword, newPassword, confirmPassword };
}
