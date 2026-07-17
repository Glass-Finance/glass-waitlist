// Canonical list of the community-setup onboarding sequence, shared by every
// step's own page so the count/order only needs to change in one place.
// Excludes Sign Up + OTP verification (account creation, not community
// setup -- a user can sign up without ever creating a community, e.g.
// arriving via a join invite) and Join Community (a completely separate
// branch off ChoosePath that never re-enters this sequence).
export const ONBOARDING_STEPS = [
  { id: "choose-path",   label: "Choose Path" },
  { id: "paying-member", label: "Paying Member" },
  { id: "organization",  label: "Organization Profile" },
  { id: "payment",       label: "Payment Account" },
  { id: "members",       label: "Members" },
];
