import client from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT LINKS — admin CRUD + lifecycle, community-scoped
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/communities/{communityIdentifier}/payment-links
export const getCommunityPaymentLinks = (communityId) =>
  client.get(`/communities/${communityId}/payment-links`);

// GET /api/v1/communities/{communityIdentifier}/payment-links/{id}/members
// Lists members resolved from the payment link's audience with their
// obligation status (PAID, DUE, OVERDUE, WAIVED) and per-status counts.
// Filterable by obligationStatus, memberStatus, groupId, dueFrom, dueTo.
export const getPaymentLinkMembers = (communityId, paymentLinkId, params = {}) =>
  client.get(`/communities/${communityId}/payment-links/${paymentLinkId}/members`, { params });

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
// Confirmed via backend Swagger: activate/pause/resume/expire/archive are
// PATCH (state transitions on the same resource). Only duplicate is POST
// (creates a new resource).
function patchAction(action) {
  return (communityId, paymentLinkId) =>
    client.patch(`/communities/${communityId}/payment-links/${paymentLinkId}/${action}`);
}

export const activatePaymentLink  = patchAction("activate");
export const pausePaymentLink     = patchAction("pause");
export const resumePaymentLink    = patchAction("resume");
export const expirePaymentLink    = patchAction("expire");
export const archivePaymentLink   = patchAction("archive");

// POST — creates a new payment link from an existing one
export const duplicatePaymentLink = (communityId, paymentLinkId, payload) =>
  client.post(`/communities/${communityId}/payment-links/${paymentLinkId}/duplicate`, payload);
