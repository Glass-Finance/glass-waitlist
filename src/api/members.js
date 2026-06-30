import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/user/me — current authenticated user
export const getMe = () =>
  client.get("/user/me");

// PATCH /api/v1/user/profile
// { userData: { firstName, lastName, phoneNumber, profileImageFileId, ... } }
export const updateProfile = (payload) => client.patch("/user/profile", payload);

// PATCH /api/v1/user/password — { oldPassword, newPassword, confirmPassword }
export const updatePassword = (payload) => client.patch("/user/password", payload);

// PATCH /api/v1/user/email — { email, emailVerificationOtp }
export const updateEmail = (payload) => client.patch("/user/email", payload);

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITIES (member perspective)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/me — all communities the user belongs to
export const getMyCommunities = () =>
  client.get("/communities/me");

// GET /api/v1/communities/{communityIdentifier} — single community
export const getCommunity = (communityId) =>
  client.get(`/communities/${communityId}`);

// GET /api/v1/communities/{communityIdentifier}/members/me
// — current user's member record within a community
export const getMyMemberRecord = (communityId) =>
  client.get(`/communities/${communityId}/members/me`);

// PATCH /api/v1/communities/{communityIdentifier}/leave
export const leaveCommunity = (communityId) =>
  client.patch(`/communities/${communityId}/leave`);

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE — member obligations (upcoming / dues)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/finance/obligations/me — list member's obligations
// These map to "upcoming payments" in the UI. Paginated server-side, so a
// member with more obligations than the backend's default page size would
// silently see an incomplete list without an explicit pageSize.
export const getMyObligations = () =>
  client.get("/finance/obligations/me", { params: { pageSize: 200 } });

// GET /api/v1/finance/obligations/me/{obligationId}
export const getObligation = (obligationId) =>
  client.get(`/finance/obligations/me/${obligationId}`);

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE — member transactions (payment history)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/finance/transactions/me — paginated server-side, same reason
// as getMyObligations above.
export const getMyTransactions = () =>
  client.get("/finance/transactions/me", { params: { pageSize: 200 } });

// GET /api/v1/finance/transactions/me/{transactionIdentifier}
export const getTransaction = (transactionId) =>
  client.get(`/finance/transactions/me/${transactionId}`);

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE — payment authorisations (auto-pay / saved cards)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/finance/authorizations — member's active payment authorisations
export const getMyAuthorisations = () =>
  client.get("/finance/authorizations", { params: { pageSize: 100 } });

// GET /api/v1/finance/authorizations/{authorizationId}
export const getAuthorisation = (authId) =>
  client.get(`/finance/authorizations/${authId}`);

// DELETE /api/v1/finance/authorizations/{authorizationId} — disable auto-pay
export const deleteAuthorisation = (authId) =>
  client.delete(`/finance/authorizations/${authId}`);

// GET /api/v1/finance/banks — list Nigerian banks from Paystack
export const getBanks = () =>
  client.get("/finance/banks");

// GET /api/v1/finance/resolve-account?bankCode=&accountNumber=
export const resolveAccount = (bankCode, accountNumber) =>
  client.get("/finance/resolve-account", { params: { bankCode, accountNumber } });

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT — initiate payment for an obligation / payment link
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/payments/payment-links/{paymentLinkIdentifier}/pay
// Confirmed via backend doc: /pay is a SUFFIX on the payment link ID, not a
// prefix before payment-links. Previous path was wrong.
// payload: { idempotencyKey, amount, savePaymentMethod, obligationId, metadata }
// response.data.data: { transactionId, reference, authorizationUrl, accessCode, amount, currency }
export const initiatePayment = (paymentLinkId, payload) =>
  client.post(`/payments/payment-links/${paymentLinkId}/pay`, payload);

// POST /api/v1/payments/callback/verify?reference=xxx — reference is a query
// param, not a body field.
export const verifyPayment = (reference) =>
  client.post("/payments/callback/verify", null, { params: { reference } });

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY PAYMENT LINKS (visible to members)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/payment-links — list visible payment links
export const getPaymentLinks = () =>
  client.get("/payment-links");

// GET /api/v1/payment-links/{paymentLinkIdentifier}
export const getPaymentLink = (id) =>
  client.get(`/payment-links/${id}`);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/notifications — fetch all user notifications
export const getNotifications = () =>
  client.get("/notifications");

// GET /api/v1/notifications/unread-count
export const getUnreadCount = () =>
  client.get("/notifications/unread-count");

// PATCH /api/v1/notifications/{notificationId}/read
export const markAsRead = (notificationId) =>
  client.patch(`/notifications/${notificationId}/read`);

// PATCH /api/v1/notifications/read-all
export const markAllAsRead = () =>
  client.patch("/notifications/read-all");

// GET /api/v1/notifications/preferences
export const getNotificationPreferences = () =>
  client.get("/notifications/preferences");

// PATCH /api/v1/notifications/preferences
export const updateNotificationPreferences = (payload) =>
  client.patch("/notifications/preferences", payload);
