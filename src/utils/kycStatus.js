// KYC account + attempt status semantics.
//
// Every backend KYC status literal the frontend interprets, in one place
// (same pattern as paymentStatus.js). Account status comes from GET /kyc
// (KycStatus); attempt status from attempt/session responses (KycAttemptStatus)
// and shares the overlapping subset of literals. These are pure classifiers
// and display maps — they never fetch, never mutate.
//
// Why centralized:
//   - Account gates (community create/manage) must only treat APPROVED as
//     verified; inventing "verified"/"active" synonyms would diverge from
//     kyc-frontend-integration.md.
//   - Terminal unsuccessful outcomes (REJECTED/ERROR/EXPIRED/REVOKED) are
//     the retry gate for starting a new attempt — scattered string compares
//     would drift when the backend adds a value.
//   - Display labels/Tailwind classes live here so Settings, Home, history,
//     and member status cards cannot disagree on chip copy or colors.
//
// Admin table badges intentionally use platform-admin STATUS_COLORS
// (shared.js), which mirrors the same enum set for the dashboard chrome.
// Case folding is intentional: backend enums are uppercase; callers may
// pass raw or already-normalized values.
const STYLES = {
  approved: { cls: "bg-success-tint text-[#15803d]", text: "Approved" },
  pending: { cls: "bg-[#fef9c3] text-[#b45309]", text: "Pending" },
  inReview: { cls: "bg-[#fef9c3] text-[#b45309]", text: "In review" },
  rejected: { cls: "bg-[#fce4e4] text-danger", text: "Rejected" },
  error: { cls: "bg-[#fce4e4] text-danger", text: "Error" },
  expired: { cls: "bg-stacked-container text-[#6B7280]", text: "Expired" },
  revoked: { cls: "bg-[#fce4e4] text-danger", text: "Revoked" },
  notStarted: { cls: "bg-stacked-container text-[#6B7280]", text: "Not started" },
  initiated: { cls: "bg-[#fef9c3] text-[#b45309]", text: "In progress" },
  processing: { cls: "bg-[#fef9c3] text-[#b45309]", text: "Processing" },
};

const KEYS = {
  NOT_STARTED: "notStarted",
  PENDING: "pending",
  IN_REVIEW: "inReview",
  APPROVED: "approved",
  REJECTED: "rejected",
  ERROR: "error",
  EXPIRED: "expired",
  REVOKED: "revoked",
  INITIATED: "initiated",
  PROCESSING: "processing",
};

export function kycStatusLabel(status) {
  const key = KEYS[String(status ?? "").toUpperCase()];
  return key ? STYLES[key].text : "—";
}

export function kycStatusStyle(status) {
  const key = KEYS[String(status ?? "").toUpperCase()];
  const s = key ? STYLES[key] : { cls: "bg-stacked-container text-[#6B7280]", text: "—" };
  return { label: s.text, cls: s.cls };
}

export const ID_TYPE_OPTIONS = [
  { value: "BVN", label: "BVN" },
  { value: "VOTER_ID", label: "Voter's card" },
  { value: "V_NIN", label: "Virtual NIN" },
  { value: "NIN_SLIP", label: "NIN slip" },
  { value: "NIN_V2", label: "NIN" },
];

export function idTypeLabel(idType) {
  return ID_TYPE_OPTIONS.find((o) => o.value === idType)?.label ?? idType ?? "—";
}

// Account statuses where starting is blocked / nothing to show as "current".
export function isKycApproved(status) {
  return String(status ?? "").toUpperCase() === "APPROVED";
}

export function isKycTerminal(status) {
  const s = String(status ?? "").toUpperCase();
  return s === "REJECTED" || s === "ERROR" || s === "EXPIRED" || s === "REVOKED";
}
