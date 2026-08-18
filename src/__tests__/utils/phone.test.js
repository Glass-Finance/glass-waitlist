import { describe, it, expect } from "vitest";
import { isPhoneValid } from "../../utils/phone";

describe("isPhoneValid", () => {
  it("accepts a plain international number with a leading +", () => {
    expect(isPhoneValid("+2348031234567")).toBe(true);
  });

  it("accepts a number with spaces, dashes, and parentheses stripped before checking", () => {
    expect(isPhoneValid("+234 (803) 123-4567")).toBe(true);
  });

  it("accepts a bare national number with no country code", () => {
    expect(isPhoneValid("08031234567")).toBe(true);
  });

  it("rejects fewer than 7 digits", () => {
    expect(isPhoneValid("123456")).toBe(false);
  });

  it("rejects more than 15 digits", () => {
    expect(isPhoneValid("1234567890123456")).toBe(false);
  });

  it("rejects letters", () => {
    expect(isPhoneValid("080abc4567")).toBe(false);
  });

  it("rejects null/undefined without throwing", () => {
    expect(isPhoneValid(null)).toBe(false);
    expect(isPhoneValid(undefined)).toBe(false);
  });
});
