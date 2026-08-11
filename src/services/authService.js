// src/services/authService.js
// Thin wrappers around the Authentication API endpoints.

import client from "../api/client";

// Builds the { email } or { phoneNumber, phoneRegion } identifier shape the
// backend's auth endpoints require -- callers pass whatever they collected
// and this picks exactly one, since the backend rejects both/neither.
function identifierPayload({ email, phoneNumber, phoneRegion }) {
  return email ? { email } : { phoneNumber, phoneRegion };
}

/**
 * Register a new account.
 * @returns {Promise<{accessToken, refreshToken, userId, email, emailVerified, ...}>}
 */
export async function register(payload) {
  const { data } = await client.post("/auth/register", payload);
  return data.data;
}

/**
 * Request a registration OTP for an unclaimed phone number.
 * @returns {Promise<{expiresAt}>}
 */
export async function requestPhoneOtp({ phoneNumber, phoneRegion }) {
  const { data } = await client.post("/auth/phone/request-otp", { phoneNumber, phoneRegion });
  return data.data;
}

/**
 * Verify a registration phone OTP — returns a single-use confirmToken to
 * pass to register().
 * @returns {Promise<{confirmToken, expiresAt}>}
 */
export async function verifyPhoneOtp({ phoneNumber, phoneRegion, otp }) {
  const { data } = await client.post("/auth/phone/verify-otp", { phoneNumber, phoneRegion, otp });
  return data.data;
}

/**
 * Verify email with the code sent to the user's inbox.
 * @param {string} email
 * @param {string} token - the OTP/verification code
 */
export async function verifyEmail({ email, token }) {
  const { data } = await client.post("/auth/verify", { email, token });
  return data.data;
}

/**
 * Resend the verification email/code.
 */
export async function resendVerification({ email }) {
  const { data } = await client.post("/auth/verify/resend", { email });
  return data;
}

/**
 * Log in with a password -- identifier is email or phone (phoneRegion goes
 * with a national-format number).
 */
export async function login({ email, phoneNumber, phoneRegion, password }) {
  const { data } = await client.post("/auth/login", {
    ...identifierPayload({ email, phoneNumber, phoneRegion }),
    password,
    deviceInfo: navigator.userAgent,
  });
  return data.data;
}

/**
 * Request a passwordless login OTP -- delivered by email or SMS depending
 * on which identifier is supplied. Distinct from requestPhoneOtp/
 * verifyPhoneOtp above: those verify a phone number during registration
 * (/auth/phone/*, return a confirmToken for register()); these log into an
 * account that already exists, with no confirmToken involved.
 * @returns {Promise<{expiresAt}>}
 */
export async function requestLoginOtp({ email, phoneNumber, phoneRegion }) {
  const { data } = await client.post(
    "/auth/otp/request",
    identifierPayload({ email, phoneNumber, phoneRegion }),
  );
  return data.data;
}

/**
 * Exchange a passwordless login OTP for a session (or an MFA challenge).
 */
export async function verifyLoginOtp({ email, phoneNumber, phoneRegion, token }) {
  const { data } = await client.post("/auth/otp/verify", {
    ...identifierPayload({ email, phoneNumber, phoneRegion }),
    token,
    deviceInfo: navigator.userAgent,
  });
  return data.data;
}

/**
 * Log out — invalidates the refresh token server-side.
 */
export async function logout() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return;
  const { data } = await client.post("/auth/logout", { refreshToken });
  return data;
}

/**
 * Forgot password — sends a reset code to every eligible channel for the
 * resolved user (email, and phone once verified). The identifier here only
 * resolves *which* user, not which channel to use.
 */
export async function forgotPassword({ email, phoneNumber, phoneRegion }) {
  const { data } = await client.post(
    "/auth/password/forgot",
    identifierPayload({ email, phoneNumber, phoneRegion }),
  );
  return data;
}

/**
 * Reset password using the code from forgotPassword(). The reset challenge
 * is keyed to the resolved user, not the identifier originally used to
 * request it -- so this can be completed with either the user's email or
 * phone number, independent of which one requested the code.
 */
export async function resetPassword({ email, phoneNumber, phoneRegion, token, newPassword, confirmPassword }) {
  const { data } = await client.post("/auth/password/reset", {
    ...identifierPayload({ email, phoneNumber, phoneRegion }),
    token,
    newPassword,
    confirmPassword,
  });
  return data;
}

/**
 * Google OAuth login/signup.
 */
export async function googleAuth({ clientToken }) {
  const { data } = await client.post("/auth/google", { clientToken });
  return data.data;
}

/**
 * Complete MFA login with a TOTP code.
 */
export async function verifyMfaLogin({ challengeToken, code }) {
  const { data } = await client.post("/auth/mfa/totp/verify-login", {
    challengeToken,
    code,
    deviceInfo: navigator.userAgent,
  });
  return data.data;
}

/**
 * Initiate TOTP MFA setup — returns { secret, qrCodeUri } or { qrCodeImage, secret }.
 */
export async function setupMfaTotp() {
  const { data } = await client.post("/auth/mfa/totp/setup", { label: "Authenticator app" });
  return data.data;
}

export async function enableMfaTotp({ code }) {
  const { data } = await client.post("/auth/mfa/totp/enable", { code });
  return data.data; // { recoveryCodes: [...] }
}

/**
 * Disable MFA — requires the current TOTP code to confirm.
 * @param {string} code - 6-digit TOTP code
 */
export async function disableMfaTotp({ code }) {
  const { data } = await client.post("/auth/mfa/totp/disable", { code });
  return data.data;
}

/**
 * Persist auth tokens + basic user info to localStorage.
 */
export function storeAuthSession(authData) {
  if (authData.accessToken)  localStorage.setItem("accessToken",  authData.accessToken);
  // Guard against storing the literal string "undefined" if the auth response
  // omits refreshToken — an "undefined" string is truthy and fools the
  // refresh-token check in client.js, causing the next refresh to fail.
  if (authData.refreshToken) localStorage.setItem("refreshToken", authData.refreshToken);
  if (authData.userId)       localStorage.setItem("userId",       authData.userId);
  if (authData.email)        localStorage.setItem("userEmail",    authData.email);
}