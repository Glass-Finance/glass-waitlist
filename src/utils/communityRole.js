import { getMyMemberRecord } from "../api/members";

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
