import { describe, it, expect } from "vitest";
import { roleKeyword, isCommunityAdmin, isMemberRoleOwner } from "../../utils/communityRole";

describe("roleKeyword", () => {
  it("matches a plain role string", () => {
    expect(roleKeyword("ADMIN")).toBe("ADMIN");
    expect(roleKeyword("COMMUNITY_ADMIN")).toBe("ADMIN");
  });

  // Regression: the live /communities/{id}/members response returns
  // roleCode "COMMUNITY_OWNER" for the owner's own auto-created member row,
  // not bare "OWNER" -- a raw === check against "OWNER" (what
  // AdminDashboard.jsx's gsHasMembers used before this was fixed) never
  // matched it, so the owner silently counted as a "real" member.
  it("matches the real API's COMMUNITY_OWNER roleCode", () => {
    expect(roleKeyword("COMMUNITY_OWNER")).toBe("OWNER");
  });

  it("matches a display-name string", () => {
    expect(roleKeyword("Community Admin")).toBe("ADMIN");
  });

  it("matches an object's code, roleCode, or name fields", () => {
    expect(roleKeyword({ code: "OWNER" })).toBe("OWNER");
    expect(roleKeyword({ roleCode: "MANAGER" })).toBe("MANAGER");
    expect(roleKeyword({ name: "Community Member" })).toBe("MEMBER");
  });

  it("checks multiple arguments, using whichever one matches", () => {
    expect(roleKeyword(undefined, "MEMBER", null)).toBe("MEMBER");
  });

  it("prioritizes OWNER over ADMIN when both keywords are present", () => {
    expect(roleKeyword("OWNER_ADMIN")).toBe("OWNER");
  });

  it("returns null when nothing matches a known keyword", () => {
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

  it("returns true for ADMIN/MANAGER/OWNER roles", () => {
    expect(isCommunityAdmin({ roleCode: "ADMIN" })).toBe(true);
    expect(isCommunityAdmin({ roleCode: "MANAGER" })).toBe(true);
    expect(isCommunityAdmin({ roleCode: "OWNER" })).toBe(true);
  });

  it("returns false for a plain MEMBER role", () => {
    expect(isCommunityAdmin({ roleCode: "MEMBER" })).toBe(false);
  });
});

describe("isMemberRoleOwner", () => {
  // Regression coverage for AdminDashboard.jsx's gsHasMembers: a fresh
  // community with nobody but its auto-added owner must not read as
  // already having a "real" member.
  it("returns true for the real API's COMMUNITY_OWNER roleCode", () => {
    expect(isMemberRoleOwner({ roleCode: "COMMUNITY_OWNER" })).toBe(true);
  });

  it("returns true for a bare OWNER roleCode too", () => {
    expect(isMemberRoleOwner({ roleCode: "OWNER" })).toBe(true);
  });

  it("returns false for admin/manager/member roles", () => {
    expect(isMemberRoleOwner({ roleCode: "COMMUNITY_ADMIN" })).toBe(false);
    expect(isMemberRoleOwner({ roleCode: "MANAGER" })).toBe(false);
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
