import { describe, it, expect } from "vitest";
import { isSafeReturnPath } from "../../utils/returnPath";

describe("isSafeReturnPath", () => {
  it("passes personalized invite deep-links with member-only defaults", () => {
    // Backend invite links carry UUID inviteIds (hex + hyphens only —
    // inviteUrl() builds /invites?inviteId=<UUID>); the frontend ?token=
    // shape is equally opaque. Neither / nor // can occur in a real token,
    // and the query below exercises stricter-than-real charsets.
    expect(isSafeReturnPath("/member/join?token=abc-DEF_123")).toBe(
      "/member/join?token=abc-DEF_123",
    );
    expect(isSafeReturnPath("/member/join?token=abc%3D%3D")).toBe("/member/join?token=abc%3D%3D");
    expect(isSafeReturnPath("/member/join?token=aB3-_x&email=user%40example.com")).toBe(
      "/member/join?token=aB3-_x&email=user%40example.com",
    );
  });

  it("accepts member destinations with query strings preserved", () => {
    expect(isSafeReturnPath("/member/invites")).toBe("/member/invites");
    expect(isSafeReturnPath("/member/pay/abc?reference=ref-1")).toBe(
      "/member/pay/abc?reference=ref-1",
    );
    expect(isSafeReturnPath("/member")).toBe("/member");
  });

  it("rejects member paths for admin-only destinations by default", () => {
    expect(isSafeReturnPath("/dashboard/home")).toBeNull();
    expect(isSafeReturnPath("/onboarding/choose-path")).toBeNull();
    expect(isSafeReturnPath("/payment/callback?reference=r")).toBeNull();
  });

  it("accepts dashboard/onboarding/payment destinations in admin contexts", () => {
    const opts = { allowAdminPaths: true };
    expect(isSafeReturnPath("/dashboard/home", opts)).toBe("/dashboard/home");
    expect(isSafeReturnPath("/dashboard/members?community=x", opts)).toBe(
      "/dashboard/members?community=x",
    );
    expect(isSafeReturnPath("/onboarding/choose-path", opts)).toBe("/onboarding/choose-path");
    expect(isSafeReturnPath("/payment/callback?ref=1", opts)).toBe("/payment/callback?ref=1");
    expect(isSafeReturnPath("/member/invites?x=1", opts)).toBe("/member/invites?x=1");
  });

  it("allowAdminPaths=false rejects every dashboard/onboarding/payment path", () => {
    for (const p of [
      "/dashboard",
      "/dashboard/home",
      "/onboarding",
      "/onboarding/choose-path",
      "/payment/callback",
      "/payment/callback?ref=1",
    ]) {
      expect(isSafeReturnPath(p)).toBeNull();
    }
  });

  it("rejects external, protocol-relative, and scheme URLs", () => {
    expect(isSafeReturnPath("https://evil.com")).toBeNull();
    expect(isSafeReturnPath("//evil.com")).toBeNull();
    expect(isSafeReturnPath("javascript:alert(1)")).toBeNull();
    expect(isSafeReturnPath("/https://evil.com")).toBeNull();
    expect(isSafeReturnPath("/\\evil.com")).toBeNull();
  });

  it("rejects backslashes, traversal, and encoded traversal (single and double)", () => {
    expect(isSafeReturnPath("/member\\home")).toBeNull();
    expect(isSafeReturnPath("/member/../dashboard/home")).toBeNull();
    expect(isSafeReturnPath("/member/%2e%2e/dashboard")).toBeNull();
    expect(isSafeReturnPath("/%2fevil.com")).toBeNull();
    expect(isSafeReturnPath("/%5cevil.com")).toBeNull();
    expect(isSafeReturnPath("%2f%2fevil.com")).toBeNull();
    expect(isSafeReturnPath("/%252f%252fevil.com")).toBeNull();
    expect(isSafeReturnPath("/member/%0d%0a")).toBeNull();
  });

  it("rejects a lone percent sign without throwing", () => {
    expect(isSafeReturnPath("/member/%")).toBeNull();
  });

  it("rejects invalid percent-encodings without throwing", () => {
    expect(isSafeReturnPath("/member/%zz")).toBeNull();
  });

  it("rejects truncated percent-encoded sequences without throwing", () => {
    expect(isSafeReturnPath("/member/%E0%A4%A")).toBeNull();
  });

  it("rejects non-ASCII after decoding", () => {
    // No legitimate app destination carries encoded non-ASCII: community
    // slugs are ASCII-normalized server-side (SlugUtility strips non-Latin),
    // invite tokens are UUID/opaque ASCII, and reference IDs are ASCII.
    expect(isSafeReturnPath("/member/%C3%A9")).toBeNull();
  });

  it("rejects control characters and embedded whitespace", () => {
    expect(isSafeReturnPath("/\n/evil.com")).toBeNull();
    expect(isSafeReturnPath("/member\t/x")).toBeNull();
    expect(isSafeReturnPath("/member/ho\r\nme")).toBeNull();
    expect(isSafeReturnPath("/member/ho me")).toBeNull();
    // Leading/trailing whitespace alone is trimmed, then accepted.
    expect(isSafeReturnPath("  /member/home  ")).toBe("/member/home");
  });

  it("matches allowlist roots on segment boundaries only", () => {
    expect(isSafeReturnPath("/members-x")).toBeNull();
    expect(isSafeReturnPath("/memberevil")).toBeNull();
    expect(isSafeReturnPath("/dashboardx", { allowAdminPaths: true })).toBeNull();
    expect(isSafeReturnPath("/payment/callbackevil", { allowAdminPaths: true })).toBeNull();
    expect(isSafeReturnPath("/onboardingx", { allowAdminPaths: true })).toBeNull();
  });

  it("rejects non-strings, empties, and non-internal paths", () => {
    expect(isSafeReturnPath(null)).toBeNull();
    expect(isSafeReturnPath(undefined)).toBeNull();
    expect(isSafeReturnPath("")).toBeNull();
    expect(isSafeReturnPath("member/home")).toBeNull();
    expect(isSafeReturnPath("/sign-in")).toBeNull();
    expect(isSafeReturnPath("/")).toBeNull();
  });
});
