import { describe, expect, it } from "vitest";
import { isPlatformAdminRole, normalizePlatformRole } from "../../utils/platformRole";

// Backend-verified platform roles (core.platform_roles seed): USER,
// SUPER_ADMIN, OPERATIONS_ADMIN, COMPLIANCE_ADMIN, SUPPORT_AGENT,
// READ_ONLY_ANALYST. Only the full-admin set grants admin-shell access;
// backend authorization itself is permission-based.

describe("normalizePlatformRole", () => {
  it("normalizes casing and surrounding whitespace", () => {
    expect(normalizePlatformRole(" super_admin ")).toBe("SUPER_ADMIN");
  });

  it("returns an empty string for missing or non-string roles", () => {
    expect(normalizePlatformRole()).toBe("");
    expect(normalizePlatformRole(null)).toBe("");
    expect(normalizePlatformRole({ code: "ADMIN" })).toBe("");
  });
});

describe("isPlatformAdminRole", () => {
  it("grants the full admin shell to the exact backend admin set", () => {
    expect(isPlatformAdminRole("SUPER_ADMIN")).toBe(true);
    expect(isPlatformAdminRole("OPERATIONS_ADMIN")).toBe(true);
    expect(isPlatformAdminRole("COMPLIANCE_ADMIN")).toBe(true);
    expect(isPlatformAdminRole(" super_admin ")).toBe(true);
  });

  it("treats USER as a regular account regardless of casing", () => {
    expect(isPlatformAdminRole("USER")).toBe(false);
    expect(isPlatformAdminRole(" user ")).toBe(false);
  });

  it("withholds the admin shell from legitimate non-admin platform roles", () => {
    // SUPPORT_AGENT and READ_ONLY_ANALYST hold narrow permission subsets
    // server-side; their frontend destination is deferred product behavior,
    // so they fall back to standard non-admin routing like USER.
    expect(isPlatformAdminRole("SUPPORT_AGENT")).toBe(false);
    expect(isPlatformAdminRole("READ_ONLY_ANALYST")).toBe(false);
  });

  it("fails closed for unknown, missing, or blank roles", () => {
    expect(isPlatformAdminRole("PLATFORM_SUPER_ADMIN")).toBe(false);
    expect(isPlatformAdminRole("ADMIN")).toBe(false);
    expect(isPlatformAdminRole()).toBe(false);
    expect(isPlatformAdminRole("  ")).toBe(false);
  });
});
