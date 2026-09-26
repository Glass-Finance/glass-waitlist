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
// Reactive block copy + the backend-403 matcher live here too: every
// catch site must recognize and phrase the same KYC rejection identically.
// Case folding is intentional: backend enums are uppercase; callers may
// pass raw or already-normalized values.
const STYLES = {
  approved: { cls: "bg-success-tint text-[#15803d]", text: "Approved", dot: "bg-[#15803d]" },
  pending: { cls: "bg-[#fef9c3] text-[#b45309]", text: "Pending", dot: "bg-[#b45309]" },
  inReview: { cls: "bg-[#fef9c3] text-[#b45309]", text: "In review", dot: "bg-[#b45309]" },
  rejected: { cls: "bg-[#fce4e4] text-danger", text: "Rejected", dot: "bg-danger" },
  error: { cls: "bg-[#fce4e4] text-danger", text: "Error", dot: "bg-danger" },
  expired: { cls: "bg-stacked-container text-[#6B7280]", text: "Expired", dot: "bg-[#9CA3AF]" },
  revoked: { cls: "bg-[#fce4e4] text-danger", text: "Revoked", dot: "bg-danger" },
  notStarted: {
    cls: "bg-stacked-container text-[#6B7280]",
    text: "Not started",
    dot: "bg-[#9CA3AF]",
  },
  initiated: { cls: "bg-[#fef9c3] text-[#b45309]", text: "In progress", dot: "bg-[#b45309]" },
  processing: { cls: "bg-[#fef9c3] text-[#b45309]", text: "Processing", dot: "bg-[#b45309]" },
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
  const s = key
    ? STYLES[key]
    : { cls: "bg-stacked-container text-[#6B7280]", text: "—", dot: "bg-[#9CA3AF]" };
  return { label: s.text, cls: s.cls, dot: s.dot };
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

// Exact status classifiers — callers must not re-derive string compares.
function upper(status) {
  return String(status ?? "").toUpperCase();
}

// Account statuses where starting is blocked / nothing to show as "current".
export function isKycApproved(status) {
  return upper(status) === "APPROVED";
}

export function isKycPending(status) {
  return upper(status) === "PENDING";
}

export function isKycInReview(status) {
  return upper(status) === "IN_REVIEW";
}

export function isKycNotStarted(status) {
  return upper(status) === "NOT_STARTED";
}

export function isKycTerminal(status) {
  const s = upper(status);
  return s === "REJECTED" || s === "ERROR" || s === "EXPIRED" || s === "REVOKED";
}

// Statuses where results are still moving through the pipeline (attempt
// submitted, provider processing). Powers the verification modal's live
// narrative + bounded refetch — callers must not re-derive the literal set.
export function isKycInFlight(status) {
  const s = upper(status);
  return s === "PENDING" || s === "INITIATED" || s === "PROCESSING";
}

// Admin list default filter (IN_REVIEW) + full filter set for platform-admin KYC.
export const KYC_STATUS_FILTER_OPTIONS = [
  { value: "IN_REVIEW", label: "In review" },
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ERROR", label: "Error" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

export const KYC_DEFAULT_STATUS_FILTER = "IN_REVIEW";

// Admin ID-type filter: ALL sentinel + the shared id-type set.
export const KYC_ID_TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All ID types" },
  ...ID_TYPE_OPTIONS,
];

// ── Reactive blocks (backend-enforced) ─────────────────────────────────────
// The backend rejects KYC-gated staff actions with HTTP 403 +
// "Approved KYC is required for community staff participation"
// (GlobalExceptionHandler → ApiResponse description). The client gate
// normally gets there first; this matcher catches what it can't see —
// stale summaries, deep links past the gate, invite acceptances that
// grant a staff role — so the UI shows the shared copy above instead of
// a dead-end error string.
export function isKycRequiredError(err) {
  return (
    err?.response?.status === 403 &&
    /Approved KYC is required/.test(err?.response?.data?.description ?? "")
  );
}

// One voice for every reactive block site. Admin copy speaks about the
// member being promoted; accept copy speaks to the person accepting.
export const KYC_ADMIN_BLOCK_COPY =
  "This member needs an approved identity verification before they can become an admin. Ask them to verify, then try promoting again.";
export const KYC_ACCEPT_BLOCK_COPY =
  "You need an approved identity verification before you can take an admin role. Verify your identity, then accept this invite again.";

// Completion indicator states — collapses the account enum into the four
// states the member-list badge shows. Returns null when there is nothing
// to show (missing status, or a future literal we don't recognize — fail
// quiet rather than mislabel), so KycStateBadge can ship before the
// backend adds kycStatus to the community-member DTO (docs/kyc.md).
export function kycCompletionState(status) {
  const s = upper(status);
  if (!s) return null;
  if (s === "APPROVED") return "APPROVED";
  if (s === "PENDING" || s === "IN_REVIEW" || s === "INITIATED" || s === "PROCESSING")
    return "IN_REVIEW";
  if (isKycTerminal(s)) return "REJECTED";
  if (s === "NOT_STARTED") return "NOT_STARTED";
  return null;
}
