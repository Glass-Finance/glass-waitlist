// A saved card is unusable for Auto-Pay once its expiry month has passed.
// Bank authorisations without expiry data never count as expired.
export function isAuthorisationExpired(auth) {
  if (!auth?.expYear || !auth?.expMonth) return false;
  const year = Number(auth.expYear);
  const month = Number(auth.expMonth);
  if (!year || !month) return false;
  const now = new Date();
  // Cards are valid through the last day of their expiry month.
  return year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);
}

// Confirmed with backend: a saved authorisation's consent is scoped per
// recurring plan, not per user -- the card used (and saved) on a plan's
// *first* payment is permanently what auto-charges that specific plan going
// forward. Reusing the same card as the save-method choice on a different
// plan attaches that existing authorisation to the new plan too rather than
// creating a duplicate, which is why one authorisation can carry several
// consents. There is no ambiguity on the backend's side about which card
// charges a given plan -- but naively picking "the first ACTIVE
// authorisation" client-side (the bug this replaces) can show/assume the
// wrong card whenever a payer has more than one recurring plan with
// different saved cards. Matches ManagePayments.jsx's existing findAuth()
// logic; centralised here so checkout screens stay consistent with it.
export function findAuthorisationForPlan(authorisations, { paymentLinkId, title, communityName } = {}) {
  for (const auth of authorisations ?? []) {
    if ((auth.status ?? "").toUpperCase() !== "ACTIVE") continue;
    const match = (auth.consents ?? []).find((c) => {
      if (c.revoked) return false;
      if (paymentLinkId && c.paymentLinkId) return c.paymentLinkId === paymentLinkId;
      return c.paymentLinkTitle === title && c.communityName === communityName;
    });
    if (match) return auth;
  }
  return null;
}
