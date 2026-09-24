import client from "./client";

// ─── System Config ────────────────────────────────────────────────────────────
export const getSystemConfigs = (params) => client.get("/admin/system-configs", { params });
export const getSystemConfig = (identifier) => client.get(`/admin/system-configs/${identifier}`);
export const updateSystemConfig = (id, payload) =>
  client.patch(`/admin/system-configs/${id}`, payload);

// ─── Communities ──────────────────────────────────────────────────────────────
export const getAdminCommunities = (params) => client.get("/admin/communities", { params });
export const getAdminCommunityAccounts = (params) =>
  client.get("/admin/communities/accounts", { params });
export const setCommissionOverride = (communityIdentifier, payload) =>
  client.patch(`/admin/communities/${communityIdentifier}/commission`, payload);
// decision: "ACCEPT" | "REJECT" | "REQUEST_INFO"; comment is shown to the
// community admin as verificationComment when rejecting or requesting info.
export const reviewCommunityAccount = (communityIdentifier, accountId, payload) =>
  client.patch(`/admin/communities/${communityIdentifier}/accounts/${accountId}/review`, payload);
export const getAdminCommunityBalances = (communityIdentifier, params) =>
  client.get(`/admin/communities/${communityIdentifier}/balances`, { params });

// ─── Users ────────────────────────────────────────────────────────────────────
export const getAdminUsers = (params) => client.get("/admin/users", { params });
export const getAdminUser = (userId) => client.get(`/admin/users/${userId}`);
export const suspendUser = (userId, payload) =>
  client.patch(`/admin/users/${userId}/suspend`, payload);
export const unsuspendUser = (userId) => client.patch(`/admin/users/${userId}/unsuspend`);
export const getAdminUserCommunities = (userId, params) =>
  client.get(`/admin/users/${userId}/communities`, { params });
// Mirrors the self-service flow in members.js (DELETE /user/me marks for
// deletion, then anonymizes automatically after a grace period) -- these
// let a platform admin trigger the same two phases manually. anonymize
// requires the account to already be marked for deletion (and whatever
// other deletion-eligibility checks mark-deletion itself enforces) --
// the backend rejects otherwise, surfaced via the global mutation error
// toast (see main.jsx), not replicated as client-side gating here since
// the user list response has no field exposing that eligibility upfront.
export const markUserForDeletion = (userId, payload) =>
  client.patch(`/admin/users/${userId}/mark-deletion`, payload);
export const anonymizeUser = (userId, payload) =>
  client.patch(`/admin/users/${userId}/anonymize`, payload);

// ─── Authorizations ───────────────────────────────────────────────────────────
export const getAdminAuthorizations = (params) => client.get("/admin/authorizations", { params });
export const getAdminAuthorization = (authorizationId) =>
  client.get(`/admin/authorizations/${authorizationId}`);

// ─── Balances ─────────────────────────────────────────────────────────────────
export const getAdminBalances = (params) => client.get("/admin/balances", { params });

// ─── Payment Links ────────────────────────────────────────────────────────────
export const getAdminPaymentLinks = (params) => client.get("/admin/payment-links", { params });
export const getAdminPaymentLink = (identifier) => client.get(`/admin/payment-links/${identifier}`);
export const getAdminPaymentLinkMembers = (identifier, params) =>
  client.get(`/admin/payment-links/${identifier}/members`, { params });

// ─── Notifications ────────────────────────────────────────────────────────────
export const createAdminNotification = (payload) => client.post("/admin/notifications", payload);
export const getAdminNotificationJobs = (params) =>
  client.get("/admin/notifications/jobs", { params });
export const getAdminNotificationJob = (jobId) => client.get(`/admin/notifications/jobs/${jobId}`);

// GET /api/v1/finance/resolve-account?bankCode=&accountNumber=
// Cross-checks a stored payout account against Paystack directly, so the
// admin verify action isn't just trusting whatever was saved in our DB —
// confirms the account is still real and the name matches before flipping
// status to verified.
export const resolveBankAccount = (bankCode, accountNumber) =>
  client.get("/finance/resolve-account", { params: { bankCode, accountNumber } });

// ─── Settlements ───────────────────────────────────────────────────────────────
export const getAdminSettlements = (params) => client.get("/admin/settlements", { params });
export const getAdminSettlement = (settlementId) =>
  client.get(`/admin/settlements/${settlementId}`);
export const syncAdminSettlements = (payload) => client.post("/admin/settlements/sync", payload);
export const exportAdminSettlements = (params, format = "CSV") =>
  client.post("/admin/settlements/export", null, { params: { ...params, format } });
export const getAdminSettlementSyncJobs = (params) =>
  client.get("/admin/settlements/sync-jobs", { params });
export const getAdminSettlementSyncJob = (jobId) =>
  client.get(`/admin/settlements/sync-jobs/${jobId}`);

// ─── KYC (platform admin) ────────────────────────────────────────────────────
// Permissions: platform.kyc.read / review / revoke / attempts.manage.
// List is evidence-free; always load detail before rendering review controls.
export const getAdminKycAttempts = (params) => client.get("/admin/kyc/attempts", { params });
export const getAdminKycAttempt = (attemptId) => client.get(`/admin/kyc/attempts/${attemptId}`);
// decision: "APPROVE" | "REJECT"; reason is user-visible and required.
export const decideKyc = (attemptId, payload) =>
  client.post(`/admin/kyc/attempts/${attemptId}/decision`, payload);
// Revoke the user's current APPROVED attempt. payload { reason }.
export const revokeKyc = (userId, payload) =>
  client.post(`/admin/users/${userId}/kyc/revoke`, payload);
// Enable/disable new attempts. payload { allowed, reason }.
export const setKycAttemptPolicy = (userId, payload) =>
  client.put(`/admin/users/${userId}/kyc/attempt-policy`, payload);

// ─── Reconciliation ─────────────────────────────────────────────────────────────
export const getAdminReconciliationRuns = (params) =>
  client.get("/admin/reconciliation/runs", { params });
export const getAdminReconciliationRun = (runId) =>
  client.get(`/admin/reconciliation/runs/${runId}`);
export const triggerReconciliationRun = () => client.post("/admin/reconciliation/runs");
export const triggerFullReconciliationRun = (params) =>
  client.post("/admin/reconciliation/runs/full", null, { params });
export const getReconciliationRunReport = (runId, format = "CSV") =>
  client.get(`/admin/reconciliation/runs/${runId}/report`, { params: { format } });
export const getAdminReconciliationFindings = (params) =>
  client.get("/admin/reconciliation/findings", { params });
export const reviewReconciliationFinding = (findingId, payload) =>
  client.post(`/admin/reconciliation/findings/${findingId}/review`, payload);
export const resolveReconciliationFinding = (findingId) =>
  client.post(`/admin/reconciliation/findings/${findingId}/resolve`);
