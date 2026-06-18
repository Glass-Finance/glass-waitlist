import client from "./client";

// ── Registration ──────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// payload: { email, firstName, lastName, password, inviteToken? }
export const register = (payload) =>
  client.post("/auth/register", payload);

// ── Login ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// returns: { success, data: { token, refreshToken, user } }
export const login = (email, password) =>
  client.post("/auth/login", { email, password });

// ── Google OAuth ──────────────────────────────────────────────────────────────
// POST /api/v1/auth/login/google
export const googleLogin = (idToken) =>
  client.post("/auth/login/google", { idToken });

// ── OTP ───────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/verify   — verify email OTP
export const verifyEmail = (token) =>
  client.post("/auth/verify", { token });

// POST /api/v1/auth/verify/resend — resend OTP email
export const resendVerification = (email) =>
  client.post("/auth/verify/resend", { email });

// ── Token ─────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/token/refresh
export const refreshToken = (token) =>
  client.post("/auth/token/refresh", { token });

// ── Logout ────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
export const logout = () =>
  client.post("/auth/logout");

// ── Password reset ────────────────────────────────────────────────────────────
// POST /api/v1/auth/password/reset
export const resetPassword = (email) =>
  client.post("/auth/password/reset", { email });

// POST /api/v1/auth/password/forgot
export const forgotPassword = (email) =>
  client.post("/auth/password/forgot", { email });
 