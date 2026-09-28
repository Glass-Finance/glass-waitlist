import client from "./client";

// ─── KYC (user) ──────────────────────────────────────────────────────────────
// Contract: kyc-frontend-integration.md — Glass issues the Smile ID capture
// token; the frontend never sends ID numbers, selfies, or provider job IDs.

// Smile ID result webhook (owned by the backend team).
//
// The Smile Identity Web SDK requires this url on its own initialisation call —
// it does not read a callback out of the capture token, and throws "Please
// provide a callback URL via the `callback_url` attribute" without it (see
// useKycVerification.runSmileCapture). One exported constant, so the request
// body and the SDK call cannot drift apart.
//
// Two things are still open, both tracked rather than assumed:
//  1. Glass mints the token with its OWN per-attempt callback
//     (…/webhooks/smile-id/attempts/{attemptId}, from backend config), which is
//     not this url. The backend accepts both paths, but which one Smile uses
//     for the browser-side result has not been confirmed with the backend team.
//  2. The backend's KycStartRequest accepts only `idType`, so `callbackUrl`
//     below is currently ignored. It is kept until (1) is settled, because the
//     divergence is the open question, not the field's harmlessness.
export const DEFAULT_SMILE_CALLBACK_URL = "https://api.glasspay.app/api/v1/webhooks/smile-id";

// GET /api/v1/kyc — account summary (source of truth for status + flags)
export const getKycSummary = () => client.get("/kyc");

// POST /api/v1/kyc/attempts — start a new attempt; body { idType, callbackUrl }
// (`callbackUrl` is not yet part of the backend DTO — see the note above.)
// Returns KycSessionResponse: { attemptId, token, tokenExpiresAt, status } (201)
export const startKycAttempt = (idType) =>
  client.post("/kyc/attempts", { idType, callbackUrl: DEFAULT_SMILE_CALLBACK_URL });

// POST /api/v1/kyc/attempts/{attemptId}/token — refresh capture token (no body)
export const refreshKycToken = (attemptId) => client.post(`/kyc/attempts/${attemptId}/token`);

// POST /api/v1/kyc/attempts/{attemptId}/confirm-submission — report successful
// Smile ID client submission. Returns KycSummaryResponse. Safe to repeat.
export const confirmKycSubmission = (attemptId) =>
  client.post(`/kyc/attempts/${attemptId}/confirm-submission`);

// GET /api/v1/kyc/attempts/{attemptId} — attempt detail
export const getKycAttempt = (attemptId) => client.get(`/kyc/attempts/${attemptId}`);

// GET /api/v1/kyc/attempts — paged history (status, pageNumber, pageSize, …)
export const listKycAttempts = (params) => client.get("/kyc/attempts", { params });
