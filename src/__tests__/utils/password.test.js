import { describe, it, expect } from "vitest";
import { isPasswordValid, getPasswordChecks } from "../../utils/password";

describe("isPasswordValid", () => {
  it("accepts a password meeting every rule", () => {
    expect(isPasswordValid("Abcdefg1!")).toBe(true);
  });

  it("rejects a password under 8 characters", () => {
    expect(isPasswordValid("Ab1!def")).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    expect(isPasswordValid("abcdefg1!")).toBe(false);
  });

  it("rejects a password with no lowercase letter", () => {
    expect(isPasswordValid("ABCDEFG1!")).toBe(false);
  });

  it("rejects a password with no digit", () => {
    expect(isPasswordValid("Abcdefgh!")).toBe(false);
  });

  it("rejects a password with no special character", () => {
    expect(isPasswordValid("Abcdefg12")).toBe(false);
  });
});

describe("getPasswordChecks", () => {
  it("reports every rule as unmet for an empty password", () => {
    const checks = getPasswordChecks("");
    expect(checks.every((c) => c.met === false)).toBe(true);
    expect(checks.map((c) => c.key)).toEqual([
      "length", "uppercase", "lowercase", "digit", "special",
    ]);
  });

  it("reports only the rules actually satisfied", () => {
    const checks = getPasswordChecks("abcdefgh");
    const met = Object.fromEntries(checks.map((c) => [c.key, c.met]));
    expect(met).toEqual({
      length: true, uppercase: false, lowercase: true, digit: false, special: false,
    });
  });

  it("reports every rule as met once all are satisfied", () => {
    const checks = getPasswordChecks("Abcdefg1!");
    expect(checks.every((c) => c.met === true)).toBe(true);
  });
});
