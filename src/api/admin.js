import client from "./client";

// ─── System Config ────────────────────────────────────────────────────────────
export const getSystemConfigs   = (params)     => client.get("/admin/system-configs", { params });
export const getSystemConfig    = (identifier) => client.get(`/admin/system-configs/${identifier}`);
export const updateSystemConfig = (id, payload)=> client.patch(`/admin/system-configs/${id}`, payload);

// ─── Communities ──────────────────────────────────────────────────────────────
export const getAdminCommunities       = (params)                          => client.get("/admin/communities", { params });
export const getAdminCommunityAccounts = (params)                          => client.get("/admin/communities/accounts", { params });
export const setCommissionOverride     = (communityIdentifier, payload)    => client.patch(`/admin/communities/${communityIdentifier}/commission`, payload);
export const verifyCommunityAccount    = (communityIdentifier, accountId)  => client.patch(`/admin/communities/${communityIdentifier}/accounts/${accountId}/verify`);
export const getAdminCommunityBalances = (communityIdentifier, params)     => client.get(`/admin/communities/${communityIdentifier}/balances`, { params });

// ─── Users ────────────────────────────────────────────────────────────────────
export const getAdminUsers            = (params)          => client.get("/admin/users", { params });
export const getAdminUser             = (userId)          => client.get(`/admin/users/${userId}`);
export const suspendUser              = (userId, payload) => client.patch(`/admin/users/${userId}/suspend`, payload);
export const unsuspendUser            = (userId)          => client.patch(`/admin/users/${userId}/unsuspend`);
export const getAdminUserCommunities  = (userId, params)  => client.get(`/admin/users/${userId}/communities`, { params });

// ─── Authorizations ───────────────────────────────────────────────────────────
export const getAdminAuthorizations = (params)          => client.get("/admin/authorizations", { params });
export const getAdminAuthorization  = (authorizationId) => client.get(`/admin/authorizations/${authorizationId}`);

// ─── Balances ─────────────────────────────────────────────────────────────────
export const getAdminBalances = (params) => client.get("/admin/balances", { params });

// ─── Payment Links ────────────────────────────────────────────────────────────
export const getAdminPaymentLinks       = (params)               => client.get("/admin/payment-links", { params });
export const getAdminPaymentLink        = (identifier)           => client.get(`/admin/payment-links/${identifier}`);
export const getAdminPaymentLinkMembers = (identifier, params)   => client.get(`/admin/payment-links/${identifier}/members`, { params });

// ─── Notifications ────────────────────────────────────────────────────────────
export const createAdminNotification  = (payload) => client.post("/admin/notifications", payload);
export const getAdminNotificationJobs = (params)  => client.get("/admin/notifications/jobs", { params });
export const getAdminNotificationJob  = (jobId)   => client.get(`/admin/notifications/jobs/${jobId}`);
