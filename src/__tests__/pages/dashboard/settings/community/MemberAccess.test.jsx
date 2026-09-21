import { describe, it, expect } from "vitest";
import { findRoleId } from "../../../../../utils/communityRole";

const ROLES = [
  { id: "owner-id", code: "COMMUNITY_OWNER", name: "Community Owner" },
  { id: "admin-id", code: "COMMUNITY_ADMIN", name: "Community Admin" },
  { id: "member-id", code: "COMMUNITY_MEMBER", name: "Community Member" },
  { id: "treasurer-id", code: "TREASURER", name: "Treasurer" },
];

describe("findRoleId", () => {
  it("resolves backend canonical codes exactly", () => {
    expect(findRoleId(ROLES, "COMMUNITY_ADMIN")).toBe("admin-id");
    expect(findRoleId(ROLES, "COMMUNITY_MEMBER")).toBe("member-id");
  });

  it("falls back to an exact (case-insensitive) name match", () => {
    expect(findRoleId([{ id: "x", name: "Community Admin" }], "COMMUNITY_ADMIN")).toBeUndefined();
    expect(findRoleId([{ id: "x", name: "Treasurer" }], "treasurer")).toBe("x");
  });

  it("never guesses: substring-only candidates yield undefined so the action stays disabled", () => {
    // Bare codes are not backend values — must not resolve via substring.
    expect(findRoleId(ROLES, "ADMIN")).toBeUndefined();
    expect(findRoleId(ROLES, "MEMBER")).toBeUndefined();
    expect(findRoleId(ROLES, "MANAGER")).toBeUndefined();
    expect(findRoleId(ROLES, "SUPERUSER")).toBeUndefined();
    expect(findRoleId([], "COMMUNITY_ADMIN")).toBeUndefined();
    expect(findRoleId(null, "COMMUNITY_ADMIN")).toBeUndefined();
  });
});
