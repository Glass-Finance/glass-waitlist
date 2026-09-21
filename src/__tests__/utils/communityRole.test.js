import { describe, it, expect } from "vitest";
import { roleKeyword, isCommunityAdmin, isMemberRoleOwner } from "../../utils/communityRole";

// Backend-verified codes (core.community_roles seed): COMMUNITY_OWNER,
// COMMUNITY_ADMIN, TREASURER, COLLECTIONS_OFFICER, VIEWER, COMMUNITY_MEMBER.
// Membership payloads always carry the canonical code; matching is exact.

describe("roleKeyword", () => {
  it("matches backend canonical codes exactly", () => {
    expect(roleKeyword("COMMUNITY_OWNER")).toBe("OWNER");
    expect(roleKeyword("COMMUNITY_ADMIN")).toBe("ADMIN");
    expect(roleKeyword("COMMUNITY_MEMBER")).toBe("MEMBER");
    expect(roleKeyword("TREASURER")).toBe("TREASURER");
    expect(roleKeyword("COLLECTIONS_OFFICER")).toBe("COLLECTIONS_OFFICER");
    expect(roleKeyword("VIEWER")).toBe("VIEWER");
  });

  it("matches exact display names from /roles/* listings", () => {
    expect(roleKeyword("Community Admin")).toBe("ADMIN");
    expect(roleKeyword("Community Owner")).toBe("OWNER");
    expect(roleKeyword("Community Member")).toBe("MEMBER");
  });

  it("matches an object's code or roleCode fields", () => {
    expect(roleKeyword({ code: "COMMUNITY_ADMIN" })).toBe("ADMIN");
    expect(roleKeyword({ roleCode: "COMMUNITY_OWNER" })).toBe("OWNER");
    expect(roleKeyword({ name: "Community Member" })).toBe("MEMBER");
  });

  it("checks multiple arguments, using whichever one matches", () => {
    expect(roleKeyword(undefined, "COMMUNITY_MEMBER", null)).toBe("MEMBER");
  });

  it("is case- and whitespace-tolerant but never substring-based", () => {
    expect(roleKeyword("  community_admin ")).toBe("ADMIN");
    expect(roleKeyword("OWNER_ADMIN")).toBe(null);
    expect(roleKeyword("READMINISTRATOR")).toBe(null);
  });

  it("rejects non-backend values: bare codes, MANAGER, and unknown roles", () => {
    expect(roleKeyword("ADMIN")).toBe(null);
    expect(roleKeyword("OWNER")).toBe(null);
    expect(roleKeyword("MEMBER")).toBe(null);
    expect(roleKeyword("MANAGER")).toBe(null);
    expect(roleKeyword({ roleCode: "MANAGER" })).toBe(null);
    expect(roleKeyword("GUEST")).toBe(null);
    expect(roleKeyword()).toBe(null);
  });
});

describe("isCommunityAdmin", () => {
  it("returns false for a nullish community", () => {
    expect(isCommunityAdmin(null)).toBe(false);
    expect(isCommunityAdmin(undefined)).toBe(false);
  });

  it("returns true when the community is owned, regardless of role fields", () => {
    expect(isCommunityAdmin({ owned: true })).toBe(true);
  });

  it("returns true for the backend admin codes only", () => {
    expect(isCommunityAdmin({ memberRole: "COMMUNITY_OWNER" })).toBe(true);
    expect(isCommunityAdmin({ memberRole: "COMMUNITY_ADMIN" })).toBe(true);
    expect(isCommunityAdmin({ roleCode: "COMMUNITY_ADMIN" })).toBe(true);
  });

  it("returns false for staff-but-read-only and member roles", () => {
    expect(isCommunityAdmin({ memberRole: "TREASURER" })).toBe(false);
    expect(isCommunityAdmin({ memberRole: "COLLECTIONS_OFFICER" })).toBe(false);
    expect(isCommunityAdmin({ memberRole: "VIEWER" })).toBe(false);
    expect(isCommunityAdmin({ memberRole: "COMMUNITY_MEMBER" })).toBe(false);
  });

  it("returns false for MANAGER, bare codes, and unknown values", () => {
    expect(isCommunityAdmin({ roleCode: "MANAGER" })).toBe(false);
    expect(isCommunityAdmin({ roleCode: "ADMIN" })).toBe(false);
    expect(isCommunityAdmin({ roleCode: "SUPERUSER" })).toBe(false);
    expect(isCommunityAdmin({})).toBe(false);
  });
});

describe("isMemberRoleOwner", () => {
  // A fresh community with nobody but its auto-added owner must not read as
  // already having a "real" member (AdminDashboard.jsx's gsHasMembers).
  it("returns true for the real API's COMMUNITY_OWNER roleCode", () => {
    expect(isMemberRoleOwner({ roleCode: "COMMUNITY_OWNER" })).toBe(true);
  });

  it("returns false for a bare OWNER code, which the backend never emits", () => {
    expect(isMemberRoleOwner({ roleCode: "OWNER" })).toBe(false);
  });

  it("returns false for admin/staff/member roles", () => {
    expect(isMemberRoleOwner({ roleCode: "COMMUNITY_ADMIN" })).toBe(false);
    expect(isMemberRoleOwner({ roleCode: "MANAGER" })).toBe(false);
    expect(isMemberRoleOwner({ roleCode: "TREASURER" })).toBe(false);
    expect(isMemberRoleOwner({ roleCode: "COMMUNITY_MEMBER" })).toBe(false);
  });

  it("falls back to the role field when roleCode is missing", () => {
    expect(isMemberRoleOwner({ role: "Community Owner" })).toBe(true);
  });

  it("returns false for a nullish or empty member record", () => {
    expect(isMemberRoleOwner(null)).toBe(false);
    expect(isMemberRoleOwner({})).toBe(false);
  });
});
