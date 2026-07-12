import { describe, it, expect } from "vitest";
import { roleKeyword, isCommunityAdmin } from "./communityRole";

describe("roleKeyword", () => {
  it("matches a plain role string", () => {
    expect(roleKeyword("ADMIN")).toBe("ADMIN");
    expect(roleKeyword("COMMUNITY_ADMIN")).toBe("ADMIN");
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
