import { describe, it, expect } from "vitest";
import { parseRecipientList } from "../../utils/parseRecipientList";

describe("parseRecipientList", () => {
  it("returns an empty list for empty/nullish input", () => {
    expect(parseRecipientList("")).toEqual([]);
    expect(parseRecipientList("   ")).toEqual([]);
    expect(parseRecipientList(undefined)).toEqual([]);
    expect(parseRecipientList(null)).toEqual([]);
  });

  it("splits on commas", () => {
    expect(parseRecipientList("a@x.com,b@x.com")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("splits on newlines", () => {
    expect(parseRecipientList("a@x.com\nb@x.com")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("splits on a mix of commas and newlines", () => {
    expect(parseRecipientList("a@x.com,\nb@x.com\nc@x.com")).toEqual([
      "a@x.com", "b@x.com", "c@x.com",
    ]);
  });

  it("trims whitespace around each entry", () => {
    expect(parseRecipientList("  a@x.com , b@x.com  ")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("drops empty entries from trailing/repeated delimiters", () => {
    expect(parseRecipientList("a@x.com,,b@x.com,")).toEqual(["a@x.com", "b@x.com"]);
    expect(parseRecipientList("a@x.com,\n\n,b@x.com")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("does not dedupe repeated entries", () => {
    expect(parseRecipientList("a@x.com,a@x.com")).toEqual(["a@x.com", "a@x.com"]);
  });
});
