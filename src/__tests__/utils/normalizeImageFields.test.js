import { describe, it, expect } from "vitest";
import { normalizeImageObject, normalizeImageUrl } from "../../utils/normalizeImageFields";

// Thin wrappers over safeImageUrl — the scheme policy itself is tested in
// safeImageUrl.test.js. What matters here is the SHAPE contract: normalization
// must preserve the object, preserve unrelated fields, leave safe values
// referentially identical, and collapse a rejected URL to null so consumers fall
// back to their initials/avatar-text branch rather than rendering the value.

const MALICIOUS = [
  "javascript:alert(document.domain)",
  "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
  "ftp://h/x.png",
  "//evil.example/x.png",
  "java\tscript:alert(1)",
  "images/x.png",
];

describe("normalizeImageObject", () => {
  it("keeps a valid https URL unchanged and referentially identical", () => {
    const image = { url: "https://res.cloudinary.com/demo/image/upload/a.png", id: 42 };
    expect(normalizeImageObject(image)).toBe(image);
  });

  it("keeps valid http, blob: and root-relative URLs unchanged", () => {
    for (const url of [
      "http://cdn.example.com/a.png",
      "blob:http://localhost:5173/9f1c",
      "/uploads/a.png",
    ]) {
      const image = { url };
      expect(normalizeImageObject(image)).toBe(image);
    }
  });

  it("nulls the url and preserves every other field when the scheme is rejected", () => {
    const image = { url: "javascript:alert(1)", id: 42, fileId: "abc", name: "logo" };
    const result = normalizeImageObject(image);

    expect(result.url).toBeNull();
    expect(result.id).toBe(42);
    expect(result.fileId).toBe("abc");
    expect(result.name).toBe("logo");
  });

  it("rejects every representative malicious or malformed scheme", () => {
    for (const url of MALICIOUS) {
      expect(normalizeImageObject({ url }).url).toBeNull();
    }
  });

  it("returns absent and non-object values untouched", () => {
    expect(normalizeImageObject(undefined)).toBeUndefined();
    expect(normalizeImageObject(null)).toBeNull();
    expect(normalizeImageObject("https://x/y.png")).toBe("https://x/y.png");
    expect(normalizeImageObject(42)).toBe(42);
  });

  it("does not mutate the input object", () => {
    const image = { url: "javascript:alert(1)", id: 1 };
    normalizeImageObject(image);
    expect(image.url).toBe("javascript:alert(1)");
  });
});

describe("normalizeImageUrl", () => {
  it("returns safe URLs unchanged", () => {
    expect(normalizeImageUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    );
    expect(normalizeImageUrl("/uploads/a.png")).toBe("/uploads/a.png");
  });

  it("returns null for every rejected scheme", () => {
    for (const url of MALICIOUS) {
      expect(normalizeImageUrl(url)).toBeNull();
    }
  });

  it("returns null for empty, blank and non-string input", () => {
    for (const value of [null, undefined, "", "   ", 42, {}, [], true]) {
      expect(normalizeImageUrl(value)).toBeNull();
    }
  });
});
