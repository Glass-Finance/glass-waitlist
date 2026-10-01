import { describe, it, expect } from "vitest";
import { safeMfaQrImageUrl, resolveMfaQrImageSrc } from "../../utils/mfaQrImageUrl";

// The MFA enrolment QR is the one legitimate `data:` consumer in this codebase:
// POST /auth/mfa/totp/setup may return the rendered code as a remote URL
// (qrCodeImage) or as an inline data URI (qrCodeDataUri). Both are
// server-supplied and both land in an <img src>, so both need validating — but
// safeImageUrl rejects all data:, so it cannot be used alone here.
//
// These tests pin the contract: ordinary URLs keep safeImageUrl's policy, and
// data: is permitted only for base64 raster images.

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("safeMfaQrImageUrl", () => {
  describe("accepted formats", () => {
    it("accepts a valid base64 PNG data URI", () => {
      expect(safeMfaQrImageUrl(PNG)).toBe(PNG);
    });

    it("accepts valid base64 jpeg, webp and gif data URIs", () => {
      for (const mime of ["jpeg", "jpg", "webp", "gif"]) {
        const value = `data:image/${mime};base64,AAAA`;
        expect(safeMfaQrImageUrl(value)).toBe(value);
      }
    });

    it("accepts a valid https QR image URL", () => {
      const value = "https://files.glasspay.app/public/mfa/qr/abc123.png";
      expect(safeMfaQrImageUrl(value)).toBe(value);
    });

    it("accepts http, blob: and root-relative values via safeImageUrl", () => {
      for (const value of [
        "http://cdn.example.com/qr.png",
        "blob:http://localhost:5173/9f1c-4b2e",
        "/uploads/qr.png",
      ]) {
        expect(safeMfaQrImageUrl(value)).toBe(value);
      }
    });

    it("trims surrounding whitespace before validating", () => {
      expect(safeMfaQrImageUrl(`  ${PNG}  `)).toBe(PNG);
    });
  });

  describe("rejected formats", () => {
    it("rejects javascript: and other script-bearing schemes", () => {
      for (const value of [
        "javascript:alert(document.domain)",
        "vbscript:msgbox(1)",
        "javascript:alert(1)//https://ok.example/x.png",
      ]) {
        expect(safeMfaQrImageUrl(value)).toBeNull();
      }
    });

    it("rejects data: URIs that are not base64 raster images", () => {
      for (const value of [
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+",
        "data:image/png,not-base64",
        "data:application/pdf;base64,AAAA",
        "data:image/png,charset=utf-8,plain",
      ]) {
        expect(safeMfaQrImageUrl(value)).toBeNull();
      }
    });

    it("rejects file:, ftp:, protocol-relative and scheme-less values", () => {
      for (const value of [
        "file:///etc/passwd",
        "ftp://h/qr.png",
        "//evil.example/qr.png",
        "qr.png",
      ]) {
        expect(safeMfaQrImageUrl(value)).toBeNull();
      }
    });

    it("rejects control-character scheme smuggling", () => {
      expect(safeMfaQrImageUrl("java\tscript:alert(1)")).toBeNull();
    });

    it("rejects empty, blank and non-string input", () => {
      for (const value of [null, undefined, "", "   ", 42, {}, [], true]) {
        expect(safeMfaQrImageUrl(value)).toBeNull();
      }
    });
  });

  describe("safeImageUrl policy is reused, not reimplemented", () => {
    it("returns exactly what safeImageUrl would for non-data values", async () => {
      const { safeImageUrl } = await import("../../utils/safeImageUrl");
      const samples = [
        "https://cdn.example.com/qr.png",
        "http://cdn.example.com/qr.png",
        "blob:http://localhost:5173/abc",
        "/uploads/qr.png",
        "javascript:alert(1)",
        "file:///etc/passwd",
        "//evil.example/x.png",
        "qr.png",
        "java\tscript:alert(1)",
        "",
      ];
      for (const value of samples) {
        expect(safeMfaQrImageUrl(value)).toBe(safeImageUrl(value));
      }
    });

    it("differs from safeImageUrl only on allowed data: URIs", async () => {
      const { safeImageUrl } = await import("../../utils/safeImageUrl");
      // safeImageUrl rejects every data: URI; this validator allows the safe ones.
      expect(safeImageUrl(PNG)).toBeNull();
      expect(safeMfaQrImageUrl(PNG)).toBe(PNG);
    });
  });
});

describe("resolveMfaQrImageSrc", () => {
  const PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const HTTPS = "https://files.glasspay.app/public/mfa/qr/abc.png";

  it("prefers a valid qrCodeImage", () => {
    expect(resolveMfaQrImageSrc({ qrCodeImage: HTTPS, qrCodeDataUri: PNG })).toBe(HTTPS);
  });

  it("falls back to a valid qrCodeDataUri when qrCodeImage is absent", () => {
    expect(resolveMfaQrImageSrc({ qrCodeDataUri: PNG })).toBe(PNG);
  });

  it("falls back to qrCodeUri when both image fields are absent", () => {
    expect(resolveMfaQrImageSrc({ qrCodeUri: HTTPS })).toBe(HTTPS);
  });

  it("accepts a data URI returned as qrCodeDataUri", () => {
    expect(resolveMfaQrImageSrc({ qrCodeDataUri: PNG })).toBe(PNG);
  });

  it("skips a malicious qrCodeImage and uses the valid qrCodeDataUri behind it", () => {
    // The regression this guards: with a plain `??` chain the present-but-unsafe
    // qrCodeImage would win on nullishness and mask the valid value behind it.
    const result = resolveMfaQrImageSrc({
      qrCodeImage: "javascript:alert(document.domain)",
      qrCodeDataUri: PNG,
    });
    expect(result).toBe(PNG);
    expect(result).not.toContain("javascript:");
  });

  it("skips a rejected data: type in qrCodeImage and uses qrCodeDataUri", () => {
    const result = resolveMfaQrImageSrc({
      qrCodeImage: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      qrCodeDataUri: PNG,
    });
    expect(result).toBe(PNG);
  });

  it("skips a data:image/svg+xml qrCodeImage — SVG can carry script", () => {
    const result = resolveMfaQrImageSrc({
      qrCodeImage: "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pjwvc2NyaXB0Pjwvc3ZnPg==",
      qrCodeDataUri: PNG,
    });
    expect(result).toBe(PNG);
  });

  it("returns null when every candidate is rejected", () => {
    expect(
      resolveMfaQrImageSrc({
        qrCodeImage: "javascript:alert(1)",
        qrCodeDataUri: "data:image/svg+xml;base64,PHN2Zz4=",
        qrCodeUri: "file:///etc/passwd",
      }),
    ).toBeNull();
  });

  it("returns null for an empty or absent payload", () => {
    for (const payload of [null, undefined, {}, { qrCodeImage: null }]) {
      expect(resolveMfaQrImageSrc(payload)).toBeNull();
    }
  });

  it("does not mutate the payload", () => {
    const payload = { qrCodeImage: "javascript:alert(1)", qrCodeDataUri: PNG };
    resolveMfaQrImageSrc(payload);
    expect(payload.qrCodeImage).toBe("javascript:alert(1)");
  });
});
