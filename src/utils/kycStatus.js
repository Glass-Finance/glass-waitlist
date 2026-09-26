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
// Each style also carries its Phosphor icon (MIT) so every pill renders
// icon + label from one map — components must not re-pick glyphs.
// Case folding is intentional: backend enums are uppercase; callers may
// pass raw or already-normalized values.
import {
  CircleDashed,
  Clock,
  ClockCountdown,
  Hourglass,
  PlayCircle,
  Prohibit,
  SealCheck,
  Spinner,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";

const STYLES = {
  approved: {
    cls: "bg-success-tint text-[#15803d]",
    text: "Approved",
    dot: "bg-[#15803d]",
    icon: SealCheck,
  },
  pending: {
    cls: "bg-[#fef9c3] text-[#b45309]",
    text: "Pending",
    dot: "bg-[#b45309]",
    icon: ClockCountdown,
  },
  inReview: {
    cls: "bg-[#fef9c3] text-[#b45309]",
    text: "In review",
    dot: "bg-[#b45309]",
    icon: Hourglass,
  },
  rejected: { cls: "bg-[#fce4e4] text-danger", text: "Rejected", dot: "bg-danger", icon: XCircle },
  error: { cls: "bg-[#fce4e4] text-danger", text: "Error", dot: "bg-danger", icon: WarningCircle },
  expired: {
    cls: "bg-stacked-container text-[#6B7280]",
    text: "Expired",
    dot: "bg-[#9CA3AF]",
    icon: Clock,
  },
  revoked: { cls: "bg-[#fce4e4] text-danger", text: "Revoked", dot: "bg-danger", icon: Prohibit },
  notStarted: {
    cls: "bg-stacked-container text-[#6B7280]",
    text: "Not started",
    dot: "bg-[#9CA3AF]",
    icon: CircleDashed,
  },
  initiated: {
    cls: "bg-[#fef9c3] text-[#b45309]",
    text: "In progress",
    dot: "bg-[#b45309]",
    icon: PlayCircle,
  },
  processing: {
    cls: "bg-[#fef9c3] text-[#b45309]",
    text: "Processing",
    dot: "bg-[#b45309]",
    icon: Spinner,
  },
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
    : {
        cls: "bg-stacked-container text-[#6B7280]",
        text: "—",
        dot: "bg-[#9CA3AF]",
        icon: CircleDashed,
      };
  // `dot` stays part of the contract (badge tests + any dot-painted
  // consumer); `Icon` is the pill's primary mark.
  return { label: s.text, cls: s.cls, dot: s.dot, Icon: s.icon };
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
