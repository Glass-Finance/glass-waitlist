// import client from "./client";

// // ── Registration ──────────────────────────────────────────────────────────────
// // POST /api/v1/auth/register
// // payload: { email, firstName, lastName, password, inviteToken? }
// export const register = (payload) =>
//   client.post("/auth/register", payload);

// // ── Login ─────────────────────────────────────────────────────────────────────
// // POST /api/v1/auth/login
// // returns: { success, data: { token, refreshToken, user } }
// export const login = (email, password) =>
//   client.post("/auth/login", { email, password });

// // ── Google OAuth ──────────────────────────────────────────────────────────────
// // POST /api/v1/auth/login/google
// export const googleLogin = (idToken) =>
//   client.post("/auth/login/google", { idToken });

// // ── OTP ───────────────────────────────────────────────────────────────────────
// // POST /api/v1/auth/verify   — verify email OTP
// export const verifyEmail = (token) =>
//   client.post("/auth/verify", { token });

// // POST /api/v1/auth/verify/resend — resend OTP email
// export const resendVerification = (email) =>
//   client.post("/auth/verify/resend", { email });

// // ── Token ─────────────────────────────────────────────────────────────────────
// // POST /api/v1/auth/token/refresh
// export const refreshToken = (token) =>
//   client.post("/auth/token/refresh", { token });

// // ── Logout ────────────────────────────────────────────────────────────────────
// // POST /api/v1/auth/logout
// export const logout = () =>
//   client.post("/auth/logout");

// // ── Password reset ────────────────────────────────────────────────────────────
// // POST /api/v1/auth/password/reset
// export const resetPassword = (email) =>
//   client.post("/auth/password/reset", { email });

// // POST /api/v1/auth/password/forgot
// export const forgotPassword = (email) =>
//   client.post("/auth/password/forgot", { email });

import client from "./client";

// All endpoints confirmed against live Swagger.
// Response envelope for auth endpoints: { success, data: {
//   accessToken, refreshToken, refreshTokenExpiresAt, userId, email,
//   platformRole, emailVerified, lastLoginAt, mfaRequired,
//   mfaChallengeToken, mfaChallengeExpiresAt, mfaFactors
// }}
// There is NO nested "user" object and NO "token" field.

// ── Registration ──────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// payload: { firstName, lastName, email, phoneNumber, password }
export const register = (payload) => client.post("/auth/register", payload);

// ── Login ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// payload: { email, password, deviceInfo }
export const login = (email, password) =>
  client.post("/auth/login", {
    email,
    password,
    deviceInfo: navigator.userAgent,
  });

// ── Google OAuth ──────────────────────────────────────────────────────────────
// POST /api/v1/auth/google
// payload: { clientToken }
export const googleLogin = (clientToken) =>
  client.post("/auth/google", { clientToken });

// ── Email verification ─────────────────────────────────────────────────────────
// POST /api/v1/auth/verify
// payload: { email, token, deviceInfo }
// NOTE: returns a full auth session (accessToken etc.) — verifying email logs you in.
export const verifyEmail = (email, token) =>
  client.post("/auth/verify", {
    email,
    token,
    deviceInfo: navigator.userAgent,
  });

// POST /api/v1/auth/verify/resend
// payload: { email }
export const resendVerification = (email) =>
  client.post("/auth/verify/resend", { email });

// ── Token ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/token/refresh
// payload: { refreshToken, deviceInfo }
export const refreshToken = (refreshTokenValue) =>
  client.post("/auth/token/refresh", {
    refreshToken: refreshTokenValue,
    deviceInfo: navigator.userAgent,
  });

// ── Logout ────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// payload: { refreshToken }
export const logout = (refreshTokenValue) =>
  client.post("/auth/logout", { refreshToken: refreshTokenValue });

// ── Password reset ────────────────────────────────────────────────────────────
// POST /api/v1/auth/password/forgot
// payload: { email }
export const forgotPassword = (email) =>
  client.post("/auth/password/forgot", { email });

// POST /api/v1/auth/password/reset
// payload: { email, token, newPassword, confirmPassword }
export const resetPassword = ({ email, token, newPassword, confirmPassword }) =>
  client.post("/auth/password/reset", {
    email,
    token,
    newPassword,
    confirmPassword,
  });

// ── MFA (TOTP) ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/mfa/totp/verify-login
// payload: { challengeToken, code, deviceInfo }
export const verifyMfaLogin = (challengeToken, code) =>
  client.post("/auth/mfa/totp/verify-login", {
    challengeToken,
    code,
    deviceInfo: navigator.userAgent,
  });

// POST /api/v1/auth/mfa/totp/setup — payload: { label }
export const setupMfa = (label) =>
  client.post("/auth/mfa/totp/setup", { label });

// POST /api/v1/auth/mfa/totp/enable — payload: { code }
export const enableMfa = (code) =>
  client.post("/auth/mfa/totp/enable", { code });

// POST /api/v1/auth/mfa/totp/disable — payload: { code }
export const disableMfa = (code) =>
  client.post("/auth/mfa/totp/disable", { code });

// POST /api/v1/auth/mfa/recovery-code/verify-login
// payload: { challengeToken, recoveryCode, deviceInfo }
export const verifyMfaRecoveryCode = (challengeToken, recoveryCode) =>
  client.post("/auth/mfa/recovery-code/verify-login", {
    challengeToken,
    recoveryCode,
    deviceInfo: navigator.userAgent,
  });
