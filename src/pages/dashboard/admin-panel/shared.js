// Shared formatters, pagination helpers, and the status-color lookup used
// across every AdminPanel section.

// `minor` controls whether `amount` is in minor units (kobo) and needs
// dividing by 100 — true for most money fields on this backend (e.g.
// commissionCapMinor). The /admin/balances endpoint is the exception: it
// returns already-major-unit decimals (e.g. 1036427.56 meaning ₦1,036,427.56),
// so callers for that data pass { minor: false }.
// `decimals` controls displayed precision — reconciliation/audit figures
// (Balances) should show kobo-level precision so a small discrepancy isn't
// silently rounded away; most other tables stay at whole-naira (decimals: 0).
export function fmt(amount, currency = "NGN", { minor = true, decimals = 0 } = {}) {
  if (amount == null) return "—";
  const value = minor ? amount / 100 : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function unwrap(res) {
  const d = res.data?.data;
  return {
    content: Array.isArray(d) ? d : (d?.content ?? []),
    totalElements: d?.totalElements ?? 0,
    totalPages: d?.totalPages ?? 1,
  };
}

export const PAGE_SIZE = 20;

// Backend pagination DTOs (CommunityQueryDto, AdminUserQueryDto, and other
// admin query DTOs) all extend a shared PageQueryDto with fields:
// { search, pageNumber, pageSize, sortBy, dir } — NOT `page`/`size`.
// Sending `page`/`size` gets silently ignored, so the backend falls back to
// its own defaults regardless of what's clicked in the UI (looks like
// "pagination is broken" but is really a param-name mismatch).
//
// NOTE ON INDEXING: local React state (`page`, the Pager component) stays
// 0-indexed — that's just UI state and is unaffected by this change.
// The backend's `pageNumber` is 1-indexed, confirmed by a 400 "Illegal
// Argument Entered" (IllegalArgumentException) returned for `pageNumber=0`
// on every admin list endpoint — consistent with a `@Min(1)` validation
// constraint on the shared PageQueryDto. So we add 1 when building the
// request and nothing else needs to change.
export function pageParams(page, size = PAGE_SIZE) {
  return { pageNumber: page + 1, pageSize: size };
}

export const STATUS_COLORS = {
  ACTIVE: { bg: "bg-green-50", text: "text-green-700" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  PENDING_ONBOARDING: { bg: "bg-amber-50", text: "text-amber-700" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-700" },
  INACTIVE: { bg: "bg-gray-100", text: "text-gray-500" },
  VERIFIED: { bg: "bg-green-50", text: "text-green-700" },
  // CommunityAccountResponse.status enum (accounts review flow). DISABLED
  // isn't listed here on purpose — it falls through to the default gray
  // badge below, which already reads correctly for a disabled state.
  UNVERIFIED: { bg: "bg-amber-50", text: "text-amber-700" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700" },
  NEED_MORE_INFORMATION: { bg: "bg-orange-50", text: "text-orange-700" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-500" },
  EXPIRED: { bg: "bg-gray-100", text: "text-gray-500" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-500" },
  PAUSED: { bg: "bg-amber-50", text: "text-amber-700" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-700" },
  FAILED: { bg: "bg-red-50", text: "text-red-700" },
  SUCCESS: { bg: "bg-green-50", text: "text-green-700" },
  ONE_TIME: { bg: "bg-blue-50", text: "text-blue-700" },
  RECURRING: { bg: "bg-purple-50", text: "text-purple-700" },
  // Present in the CommunityQueryDto status enum but were missing here,
  // so they fell through to the default gray badge (see screenshot: a
  // DELETED community rendered unstyled). Added so the badge — and the
  // Communities status filter below — can represent every valid status.
  DELETING: { bg: "bg-amber-50", text: "text-amber-700" },
  DELETED: { bg: "bg-gray-100", text: "text-gray-500" },
  // Settlement / reconciliation statuses — the Swagger spec's example
  // values ("PENDING", "NEW", "CRITICAL"...) aren't an exhaustive enum
  // list, so unlisted values still fall back to the default gray badge.
  MATCHED: { bg: "bg-green-50", text: "text-green-700" },
  MISMATCHED: { bg: "bg-red-50", text: "text-red-700" },
  RUNNING: { bg: "bg-blue-50", text: "text-blue-700" },
  NEW: { bg: "bg-amber-50", text: "text-amber-700" },
  REVIEWED: { bg: "bg-blue-50", text: "text-blue-700" },
  RESOLVED: { bg: "bg-green-50", text: "text-green-700" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700" },
  HIGH: { bg: "bg-red-50", text: "text-red-700" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700" },
  LOW: { bg: "bg-gray-100", text: "text-gray-500" },
};
