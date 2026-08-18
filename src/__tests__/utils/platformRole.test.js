import { describe, expect, it } from "vitest";
import { isPlatformAdminRole, normalizePlatformRole } from "../../utils/platformRole";

describe("normalizePlatformRole", () => {
  it("normalizes casing and surrounding whitespace", () => {
    expect(normalizePlatformRole(" platform_super_admin ")).toBe("PLATFORM_SUPER_ADMIN");
  });

  it("returns an empty string for missing or non-string roles", () => {
    expect(normalizePlatformRole()).toBe("");
    expect(normalizePlatformRole(null)).toBe("");
    expect(normalizePlatformRole({ code: "ADMIN" })).toBe("");
  });
});

describe("isPlatformAdminRole", () => {
  it("treats USER as a regular account regardless of casing", () => {
    expect(isPlatformAdminRole("USER")).toBe(false);
    expect(isPlatformAdminRole(" user ")).toBe(false);
  });

  it("treats every other non-empty platform role as admin", () => {
    expect(isPlatformAdminRole("PLATFORM_SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdminRole("SUPPORT_ADMIN")).toBe(true);
  });

  it("fails closed for a missing or blank role", () => {
    expect(isPlatformAdminRole()).toBe(false);
    expect(isPlatformAdminRole("  ")).toBe(false);
  });
});
