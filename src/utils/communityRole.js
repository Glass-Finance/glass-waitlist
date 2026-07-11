import { getMyMemberRecord } from "../api/members";

// The backend's role strings aren't a stable enum across endpoints — the
// same role surfaces as "ADMIN", "COMMUNITY_ADMIN", or the display name
// "Community Admin" depending on where it's read from. Match by keyword,
// never by exact string, or promoted admins silently read as plain members.
export function roleKeyword(...values) {
  const raw = values
    .flatMap((v) => {
      if (typeof v === "string") return v;
      if (v && typeof v === "object") return [v.code, v.roleCode, v.name];
      return [];
    })
    .filter((v) => typeof v === "string")
    .join(" ")
    .toUpperCase();
  if (raw.includes("OWNER")) return "OWNER";
  if (raw.includes("ADMIN")) return "ADMIN";
  if (raw.includes("MANAGER")) return "MANAGER";
  if (raw.includes("MEMBER")) return "MEMBER";
  return null;
}

// Whether this membership grants dashboard (admin-side) access. Ownership
// isn't the only path — members promoted to ADMIN/MANAGER administer the
// community without owning it, and must route to the dashboard, not the
// member app.
export function isCommunityAdmin(c) {
  if (!c) return false;
  if (c.owned) return true;
  const kw = roleKeyword(c.memberRole, c.roleCode, c.role);
  return kw === "OWNER" || kw === "ADMIN" || kw === "MANAGER";
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
