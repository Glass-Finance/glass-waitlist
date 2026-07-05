// src/services/authService.js
// Thin wrappers around the Authentication API endpoints.

import client from "../api/client";

/**
 * Register a new account.
 * @returns {Promise<{accessToken, refreshToken, userId, email, emailVerified, ...}>}
 */
export async function register(payload) {
  const { data } = await client.post("/auth/register", payload);
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
 * Log in with email + password.
 */
export async function login({ email, password }) {
  const { data } = await client.post("/auth/login", {
    email,
    password,
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
 * Forgot password — sends reset email.
 */
export async function forgotPassword({ email }) {
  const { data } = await client.post("/auth/password/forgot", { email });
  return data;
}

/**
 * Reset password using the token from the reset email.
 */
export async function resetPassword({ email, token, newPassword, confirmPassword }) {
  const { data } = await client.post("/auth/password/reset", {
    email,
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
  const { data } = await client.post("/auth/mfa/totp/setup");
  return data.data;
}

/**
 * Verify the TOTP code from the authenticator app to activate MFA.
 * @param {string} code - 6-digit TOTP code
 */
export async function enableMfaTotp({ code }) {
  const { data } = await client.post("/auth/mfa/totp/verify", { code });
  return data.data;
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