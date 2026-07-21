// Resolves a person's display name/email/phone from a "member"-shaped
// record where the real fields may live directly on the record or nested
// under `.user` — community-member, invite, and join-request responses
// all vary on this depending on endpoint. Consolidated out of near-
// identical copies in Members.jsx, MemberDetail.jsx, and MemberAccess.jsx.

import { toTitleCase } from "./format";

// `titleCase: false` preserves MemberAccess.jsx's pre-existing behavior of
// showing names in whatever case the backend returned, not re-casing them.
export function resolveDisplayName(record, fallback = "Member", { titleCase = true } = {}) {
  if (!record) return fallback;
  const cased = titleCase ? toTitleCase : (s) => s;
  if (record.name) return cased(record.name);
  const u = record.user ?? {};
  const first = u.firstName ?? record.firstName ?? "";
  const last = u.lastName ?? record.lastName ?? "";
  const full = `${first} ${last}`.trim();
  return cased(full || u.email || record.email || fallback);
}

export function resolveEmail(record, fallback = "—") {
  return record?.user?.email ?? record?.email ?? fallback;
}

export function resolvePhone(record, fallback = "—") {
  return record?.user?.phoneNumber ?? record?.phoneNumber ?? fallback;
}
