import { getMyMemberRecord } from "../api/members";

// Backend-verified community role codes (core.community_roles seed):
// COMMUNITY_OWNER, COMMUNITY_ADMIN, TREASURER, COLLECTIONS_OFFICER, VIEWER,
// COMMUNITY_MEMBER. Membership payloads (memberRole/roleCode) always carry
// the canonical code — see CommunitySupport.toUserCommunityResponse.
// Display names (Community Admin, …) only appear in /roles/* listings, never
// on memberships; they are recognized here by exact match (internal spaces
// normalized to underscores) for completeness, never by substring.
// Unknown, synthetic, or future codes fail closed instead of silently
// classifying as admin. In particular MANAGER and bare ADMIN/OWNER/MEMBER
// are not backend values and no longer match anything.
const ROLE_KEYWORDS = {
  COMMUNITY_OWNER: "OWNER",
  COMMUNITY_ADMIN: "ADMIN",
  COMMUNITY_MEMBER: "MEMBER",
  TREASURER: "TREASURER",
  COLLECTIONS_OFFICER: "COLLECTIONS_OFFICER",
  VIEWER: "VIEWER",
};

export function roleKeyword(...values) {
  const candidates = values.flatMap((v) => {
    if (typeof v === "string") return [v];
    if (v && typeof v === "object") return [v.code, v.roleCode, v.name];
    return [];
  });
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    // Exact match after trim + case + whitespace normalization only.
    const normalized = candidate.trim().toUpperCase().replace(/\s+/g, "_");
    if (!normalized) continue;
    const keyword = ROLE_KEYWORDS[normalized] ?? null;
    if (keyword) return keyword;
  }
  return null;
}

// Whether a /communities/{id}/members row is the community's owner —
// roleCode is the canonical COMMUNITY_OWNER code. Used to exclude the
// owner's own auto-created member row when deciding whether *any real*
// member has been added yet (AdminDashboard.jsx's gsHasMembers) -- without
// it, a brand-new community with nobody but its owner reads as already
// having a member, and the fresh-community welcome state never shows.
export function isMemberRoleOwner(m) {
  return roleKeyword(m?.roleCode, m?.role) === "OWNER";
}

// Whether this membership grants dashboard (admin-side) access. Only the
// backend-verified admin codes qualify: COMMUNITY_OWNER and COMMUNITY_ADMIN
// (which holds the community management permission set server-side).
// TREASURER, COLLECTIONS_OFFICER, VIEWER, and COMMUNITY_MEMBER are
// read-only or member-level roles and do not grant dashboard access.
export function isCommunityAdmin(c) {
  if (!c) return false;
  if (c.owned) return true;
  const kw = roleKeyword(c.memberRole, c.roleCode, c.role);
  return kw === "OWNER" || kw === "ADMIN";
}

// Role IDs resolve against the backend's canonical codes first
// (COMMUNITY_MEMBER, COMMUNITY_ADMIN, …), then an exact name match. No
// substring guessing: a wrong ID here would assign the wrong role, so an
// unresolvable role intentionally yields undefined — callers must show an
// error and disable the action instead of guessing.
export function findRoleId(roles, code) {
  const list = roles ?? [];
  return (
    list.find((r) => (r.code ?? r.roleCode ?? "").toUpperCase() === code)?.id ??
    list.find((r) => (r.name ?? "").trim().toLowerCase() === code.toLowerCase())?.id
  );
}

// Whether an admin pays dues as a member of their own community (set during
// onboarding's PayingMember step) lives on their own member record, not the
// community itself — billingExempt: false means paying. AdminDashboard.jsx's
// two exports (AdminDashboard / PayingAdminDashboard) only differ in which
// of these they're given, so every place that routes to a community's
// dashboard has to resolve this itself first.
export async function resolveIsPayingAdmin(communityId) {
  try {
    const res = await getMyMemberRecord(communityId);
    const memberRecord = res.data?.data ?? res.data;
    return memberRecord?.billingExempt === false;
  } catch {
    return false; // fall back to non-paying rather than block navigation
  }
}
