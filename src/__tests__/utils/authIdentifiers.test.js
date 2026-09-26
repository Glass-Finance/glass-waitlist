import { describe, it, expect } from "vitest";
import { parseIdentifier, validateIdentifier } from "../../utils/authIdentifiers";

describe("parseIdentifier", () => {
  it("resolves an email identifier, trimmed and lowercased", () => {
    expect(parseIdentifier("  Owner@Example.com  ")).toEqual({ email: "owner@example.com" });
  });

  it("resolves a phone identifier, trimmed but otherwise untouched", () => {
    expect(parseIdentifier("  +2348012345678  ")).toEqual({ phoneNumber: "+2348012345678" });
  });

  it("treats anything without @ as a phone number", () => {
    expect(parseIdentifier("08012345678")).toEqual({ phoneNumber: "08012345678" });
  });
});

describe("validateIdentifier", () => {
  it("requires a value", () => {
    expect(validateIdentifier("")).toBe("Enter your email or phone number.");
    expect(validateIdentifier("   ")).toBe("Enter your email or phone number.");
  });

  it("rejects a malformed email", () => {
    expect(validateIdentifier("bad@")).toBe("Enter a valid email address.");
  });

  it("accepts a valid email", () => {
    expect(validateIdentifier("sulaimon@example.com")).toBe("");
  });

  it("rejects a malformed phone number with the format hint", () => {
    expect(validateIdentifier("123")).toBe("Enter a valid phone number, e.g. +234 803 123 4567.");
  });

  it("accepts a valid phone number", () => {
    expect(validateIdentifier("+2348012345678")).toBe("");
  });
});
