// Maps a notification to the page it's about. The backend payload carries no
// target URL, so this infers one from notificationType, falling back to the
// title/body text. Returns null when no page is clearly more relevant than
// the notifications list itself — callers should treat null as "not a link".
//
// Order matters: more specific signals (join requests, auto-pay, receipts)
// are checked before broad ones (payment, member).
export function notificationTarget(n, { memberApp = false } = {}) {
  const type = (n.notificationType ?? n.type ?? "").toUpperCase();
  const text =
    `${n.title ?? n.subject ?? ""} ${n.description ?? n.message ?? n.body ?? ""}`.toUpperCase();
  const has = (...words) =>
    words.some((w) => type.includes(w) || text.includes(w));

  if (memberApp) {
    if (has("AUTO-PAY", "AUTO_PAY", "AUTOPAY", "CARD EXPIR", "SAVED CARD"))
      return "/member/auto-pay";
    if (has("RECEIPT", "SUCCESSFUL", "PAYMENT CONFIRMED", "TRANSACTION"))
      return "/member/transactions";
    if (has("REMIND", "DUE", "OVERDUE", "PAYMENT")) return "/member/upcoming";
    if (has("INVITE")) return "/member/invites";
    if (has("JOIN", "COMMUNITY", "VERIF")) return "/member/communities";
    if (has("PROFILE", "PASSWORD", "SECURITY", "ACCOUNT"))
      return "/member/settings";
    return null;
  }

  // The community dashboard resolves its community from ?community= (slug or
  // id) — carry the notification's community along so it opens the right one
  // instead of whatever localStorage last held.
  const communityRef =
    n.community?.slug ?? n.communityId ?? n.community?.id ?? null;
  const adminDash = communityRef
    ? `/dashboard/admin?community=${communityRef}`
    : "/dashboard/admin";

  if (has("JOIN_REQUEST", "JOIN REQUEST")) return "/dashboard/join-requests";
  if (has("AUTO-PAY", "AUTO_PAY", "AUTOPAY", "CARD EXPIR"))
    return "/dashboard/settings/finance/auto-pay";
  if (has("PLAN")) return "/dashboard/payments";
  // Payment activity (received/failed/overdue dues) lives on the community
  // dashboard's transactions view, not the plans page.
  if (has("PAYMENT", "TRANSACTION", "RECEIPT", "DUES", "COLLECT", "PAID"))
    return adminDash;
  if (has("MEMBER", "JOIN", "INVITE")) return "/dashboard/members";
  if (has("PROFILE", "PASSWORD", "SECURITY", "ACCOUNT"))
    return "/dashboard/settings/account/profile";
  return null;
}

// Human labels for the detail view's action button, keyed by route path
// (query strings stripped before lookup).
const ADMIN_ACTION_LABELS = {
  "/dashboard/join-requests": "View join requests",
  "/dashboard/payments": "View payment plans",
  "/dashboard/admin": "Open community dashboard",
  "/dashboard/members": "View members",
  "/dashboard/settings/finance/auto-pay": "Manage Auto-Pay",
  "/dashboard/settings/account/profile": "Open profile settings",
};

const MEMBER_ACTION_LABELS = {
  "/member/auto-pay": "Manage Auto-Pay",
  "/member/transactions": "View transactions",
  "/member/upcoming": "View upcoming payments",
  "/member/invites": "View invitations",
  "/member/communities": "View communities",
  "/member/settings": "Open settings",
};

// The detail-view variant of notificationTarget: returns { to, label } for
// the "open related page" button, or null when there's no better page.
export function notificationAction(n, opts = {}) {
  const to = notificationTarget(n, opts);
  if (!to) return null;
  const labels = opts.memberApp ? MEMBER_ACTION_LABELS : ADMIN_ACTION_LABELS;
  return { to, label: labels[to.split("?")[0]] ?? "Open related page" };
}
