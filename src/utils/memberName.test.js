import { describe, it, expect } from "vitest";
import { resolveDisplayName, resolveEmail, resolvePhone } from "./memberName";

describe("resolveDisplayName", () => {
  it("returns the fallback for a missing record", () => {
    expect(resolveDisplayName(null)).toBe("Member");
    expect(resolveDisplayName(undefined, "Unknown")).toBe("Unknown");
  });

  it("prefers an explicit name field, title-cased", () => {
    expect(resolveDisplayName({ name: "home alone" })).toBe("Home Alone");
  });

  it("builds first + last from a nested user object", () => {
    expect(resolveDisplayName({ user: { firstName: "ada", lastName: "lovelace" } }))
      .toBe("Ada Lovelace");
  });

  it("builds first + last from flat fields when there's no user object", () => {
    expect(resolveDisplayName({ firstName: "grace", lastName: "hopper" }))
      .toBe("Grace Hopper");
  });

  it("falls back to email when no name parts are present (title-cased, matching the pre-existing behavior this was consolidated from)", () => {
    expect(resolveDisplayName({ email: "ada@example.com" })).toBe("Ada@Example.Com");
    expect(resolveDisplayName({ user: { email: "ada@example.com" } })).toBe("Ada@Example.Com");
  });

  it("falls back to the default 'Member' when nothing resolves", () => {
    expect(resolveDisplayName({})).toBe("Member");
  });

  it("respects a custom fallback (also title-cased, same as the name/email path)", () => {
    expect(resolveDisplayName({}, "Unknown requester")).toBe("Unknown Requester");
  });

  it("preserves the record's original casing when titleCase is false", () => {
    expect(resolveDisplayName({ firstName: "ada", lastName: "lovelace" }, "Member", { titleCase: false }))
      .toBe("ada lovelace");
  });
});

describe("resolveEmail", () => {
  it("prefers the nested user email over a flat one", () => {
    expect(resolveEmail({ user: { email: "nested@example.com" }, email: "flat@example.com" }))
      .toBe("nested@example.com");
  });

  it("falls back to a flat email field", () => {
    expect(resolveEmail({ email: "flat@example.com" })).toBe("flat@example.com");
  });

  it("returns the default dash when neither is present", () => {
    expect(resolveEmail({})).toBe("—");
    expect(resolveEmail(null)).toBe("—");
  });

  it("respects a custom fallback", () => {
    expect(resolveEmail({}, "no email")).toBe("no email");
  });
});

describe("resolvePhone", () => {
  it("prefers the nested user phone over a flat one", () => {
    expect(resolvePhone({ user: { phoneNumber: "0800" }, phoneNumber: "0900" }))
      .toBe("0800");
  });

  it("falls back to a flat phoneNumber field", () => {
    expect(resolvePhone({ phoneNumber: "0900" })).toBe("0900");
  });

  it("returns the default dash when neither is present", () => {
    expect(resolvePhone({})).toBe("—");
    expect(resolvePhone(null)).toBe("—");
  });
});
