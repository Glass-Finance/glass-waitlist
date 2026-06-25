import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT LINKS — admin CRUD + lifecycle, community-scoped
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/payment-links
export const getCommunityPaymentLinks = (communityId) =>
  client.get(`/communities/${communityId}/payment-links`);

// GET /api/v1/communities/{communityIdentifier}/payment-links/{paymentLinkId}
export const getCommunityPaymentLink = (communityId, paymentLinkId) =>
  client.get(`/communities/${communityId}/payment-links/${paymentLinkId}`);

// POST /api/v1/communities/{communityIdentifier}/payment-links
export const createPaymentLink = (communityId, payload) =>
  client.post(`/communities/${communityId}/payment-links`, payload);

// PATCH /api/v1/communities/{communityIdentifier}/payment-links/{paymentLinkId}
export const updatePaymentLink = (communityId, paymentLinkId, payload) =>
  client.patch(`/communities/${communityId}/payment-links/${paymentLinkId}`, payload);

// ─── Lifecycle actions ────────────────────────────────────────────────────────
function lifecycleAction(action) {
  return (communityId, paymentLinkId) =>
    client.post(`/communities/${communityId}/payment-links/${paymentLinkId}/${action}`);
}

export const activatePaymentLink = lifecycleAction("activate");
export const pausePaymentLink = lifecycleAction("pause");
export const resumePaymentLink = lifecycleAction("resume");
export const expirePaymentLink = lifecycleAction("expire");
export const archivePaymentLink = lifecycleAction("archive");
export const duplicatePaymentLink = lifecycleAction("duplicate");
