import { describe, it, expect } from "vitest";
import { getEmailError, isValidEmail } from "./validators";

describe("getEmailError", () => {
  it("requires a value", () => {
    expect(getEmailError("")).toBe("Email is required.");
    expect(getEmailError("   ")).toBe("Email is required.");
  });

  it("rejects malformed addresses", () => {
    expect(getEmailError("notanemail")).toBe("Enter a valid email address.");
    expect(getEmailError("missing@domain")).toBe("Enter a valid email address.");
    expect(getEmailError("@nouser.com")).toBe("Enter a valid email address.");
  });

  it("accepts well-known providers", () => {
    expect(getEmailError("user@gmail.com")).toBe("");
    expect(getEmailError("user@yahoo.com")).toBe("");
    expect(getEmailError("user@outlook.com")).toBe("");
    expect(getEmailError("user@icloud.com")).toBe("");
  });

  it("accepts a real, unrelated company domain", () => {
    expect(getEmailError("user@babcockalumni.org")).toBe("");
    expect(getEmailError("user@glasspay.app")).toBe("");
  });

  it("flags a likely typo on a well-known domain with a suggestion", () => {
    expect(getEmailError("user@igamil.com")).toContain('"gmail.com"');
    expect(getEmailError("user@gmial.com")).toContain('"gmail.com"');
    expect(getEmailError("user@yahooo.com")).toContain('"yahoo.com"');
    expect(getEmailError("user@hotmial.com")).toContain('"hotmail.com"');
  });
});

describe("isValidEmail", () => {
  it("mirrors getEmailError", () => {
    expect(isValidEmail("user@gmail.com")).toBe(true);
    expect(isValidEmail("user@igamil.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
