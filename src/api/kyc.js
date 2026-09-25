import client from "./client";

// ─── KYC (user) ──────────────────────────────────────────────────────────────
// Contract: kyc-frontend-integration.md — Glass issues the Smile ID capture
// token; the frontend never sends ID numbers, selfies, or provider job IDs.

// Default Smile ID result webhook (supplied by the backend team) — sent when
// initiating a challenge so Glass can embed it in the Smile ID job/token.
// Start-attempt only: the refresh path re-mints from the existing attempt
// record, which already carries the callback.
const DEFAULT_SMILE_CALLBACK_URL = "https://api.glasspay.app/api/v1/webhooks/smile-id";

// GET /api/v1/kyc — account summary (source of truth for status + flags)
export const getKycSummary = () => client.get("/kyc");

// POST /api/v1/kyc/attempts — start a new attempt; body { idType, callbackUrl }
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
