import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import {
  verifyMfaLogin,
  verifyMfaRecoveryCodeLogin,
  regenerateMfaRecoveryCodes,
  setupMfaTotp,
  enableMfaTotp,
  disableMfaTotp,
} from "../../services/authService";

// Request/response contract for the two MFA recovery endpoints, verified
// against the backend source (AuthController + MfaServiceImpl):
//
//   POST /auth/mfa/recovery-code/verify-login   pre-auth, { challengeToken,
//       recoveryCode, deviceInfo } -> AuthResponse. Sits under the permitAll
//       /auth/** matcher, so no session is required. Single-use: the backend
//       marks a matched code used before completing the login.
//
//   POST /auth/mfa/recovery-codes/regenerate    authenticated (listed in
//       AppConstant.AUTH_PATHS), { code } -> { recoveryCodes }. Requires a
//       current TOTP code, and deletes every existing code before issuing the
//       replacement set.
//
// The split matters: the first is pre-auth and belongs in PRE_AUTH_PATHS, the
// second is session-authenticated and must NOT. Getting that backwards either
// hard-redirects a locked-out user off the sign-in form, or strands a
// regenerate call that legitimately should refresh.

vi.mock("../../api/client", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

beforeEach(() => {
  client.post.mockReset();
  client.get.mockReset();
  // Default to a resolved envelope. Every wrapper here destructures the axios
  // response, so an unresolved mock turns a fire-and-forget assertion into an
  // unhandled rejection that vitest reports as a file-level error even though
  // the assertions passed. Tests that care about the payload override this.
  client.post.mockResolvedValue({ data: { data: {} } });
});

describe("verifyMfaLogin (TOTP)", () => {
  it("posts the challenge token and code to the TOTP verify-login route", async () => {
    await verifyMfaLogin({ challengeToken: "challenge-1", code: "123456" });

    const [path, body] = client.post.mock.calls[0];
    expect(path).toBe("/auth/mfa/totp/verify-login");
    expect(body).toMatchObject({ challengeToken: "challenge-1", code: "123456" });
  });

  it("sends deviceInfo, as the backend's shared login response expects", async () => {
    await verifyMfaLogin({ challengeToken: "challenge-1", code: "123456" });

    expect(client.post.mock.calls[0][1].deviceInfo).toBe(navigator.userAgent);
  });

  it("unwraps the AuthResponse from the envelope's data field", async () => {
    client.post.mockResolvedValue({ data: { data: { accessToken: "tok" } } });

    await expect(verifyMfaLogin({ challengeToken: "c", code: "123456" })).resolves.toEqual({
      accessToken: "tok",
    });
  });
});

describe("verifyMfaRecoveryCodeLogin", () => {
  it("posts to the recovery-code verify-login route with both factors named per the DTO", async () => {
    await verifyMfaRecoveryCodeLogin({
      challengeToken: "challenge-1",
      recoveryCode: "A1B2C3D4E5F6G7H8",
    });

    const [path, body] = client.post.mock.calls[0];
    // Singular "recovery-code" here vs plural "recovery-codes" on regenerate —
    // the backend routes are genuinely different, so a typo would silently
    // 404 rather than fail a test somewhere else.
    expect(path).toBe("/auth/mfa/recovery-code/verify-login");
    // MfaRecoveryCodeVerifyLoginRequest: challengeToken + recoveryCode.
    // `code` would be silently ignored (unknown property), so assert on the
    // exact key rather than a subset match.
    expect(body.challengeToken).toBe("challenge-1");
    expect(body.recoveryCode).toBe("A1B2C3D4E5F6G7H8");
    expect(body).not.toHaveProperty("code");
  });

  it("sends deviceInfo so the login audit records the device", async () => {
    await verifyMfaRecoveryCodeLogin({ challengeToken: "c", recoveryCode: "A1B2C3D4E5F6G7H8" });

    expect(client.post.mock.calls[0][1].deviceInfo).toBe(navigator.userAgent);
  });

  it("transmits the recovery code exactly as given, leaving normalisation to the backend", async () => {
    // The backend's normalizeRecoveryCode() strips separators and uppercases
    // before comparing to the stored hash. Re-normalising here would be a
    // second, divergent copy of that rule.
    await verifyMfaRecoveryCodeLogin({
      challengeToken: "c",
      recoveryCode: "a1b2-c3d4-e5f6-g7h8",
    });

    expect(client.post.mock.calls[0][1].recoveryCode).toBe("a1b2-c3d4-e5f6-g7h8");
  });

  it("unwraps the AuthResponse from the envelope's data field", async () => {
    client.post.mockResolvedValue({ data: { data: { accessToken: "recovery-tok" } } });

    await expect(
      verifyMfaRecoveryCodeLogin({ challengeToken: "c", recoveryCode: "A1B2C3D4E5F6G7H8" }),
    ).resolves.toEqual({ accessToken: "recovery-tok" });
  });

  it("propagates a rejected code rather than swallowing it", async () => {
    client.post.mockRejectedValue({
      response: { status: 400, data: { message: "Invalid recovery code" } },
    });

    await expect(
      verifyMfaRecoveryCodeLogin({ challengeToken: "c", recoveryCode: "WRONG" }),
    ).rejects.toBeTruthy();
  });
});

describe("regenerateMfaRecoveryCodes", () => {
  it("posts the confirming TOTP code to the regenerate route", async () => {
    await regenerateMfaRecoveryCodes({ code: "123456" });

    const [path, body] = client.post.mock.calls[0];
    expect(path).toBe("/auth/mfa/recovery-codes/regenerate");
    // MfaRecoveryCodesRegenerateRequest takes a TOTP `code`, not a recovery code.
    expect(body).toEqual({ code: "123456" });
  });

  it("returns the fresh code set for display", async () => {
    client.post.mockResolvedValue({
      data: { data: { recoveryCodes: ["AAAA-BBBB-CCCC-DDDD"] } },
    });

    await expect(regenerateMfaRecoveryCodes({ code: "123456" })).resolves.toEqual({
      recoveryCodes: ["AAAA-BBBB-CCCC-DDDD"],
    });
  });

  it("carries no deviceInfo — this is an authenticated call, not a login", async () => {
    await regenerateMfaRecoveryCodes({ code: "123456" });

    expect(client.post.mock.calls[0][1]).not.toHaveProperty("deviceInfo");
  });
});

describe("MFA route paths are distinct", () => {
  // The recovery-code login and the recovery-codes regenerate are one character
  // apart in the middle of the path. Pinned explicitly so a copy-paste slip
  // between them fails here rather than as a mystery 404 in production.
  it("does not confuse the singular login route with the plural regenerate route", async () => {
    await verifyMfaRecoveryCodeLogin({ challengeToken: "c", recoveryCode: "A1B2C3D4E5F6G7H8" });
    await regenerateMfaRecoveryCodes({ code: "123456" });

    const paths = client.post.mock.calls.map((c) => c[0]);
    expect(paths).toEqual([
      "/auth/mfa/recovery-code/verify-login",
      "/auth/mfa/recovery-codes/regenerate",
    ]);
    expect(paths[0]).not.toBe(paths[1]);
  });
});

describe("existing TOTP setup/disable wrappers are unchanged", () => {
  it("keeps setup, enable and disable on their established routes", async () => {
    await setupMfaTotp();
    await enableMfaTotp({ code: "123456" });
    await disableMfaTotp({ code: "123456" });

    expect(client.post.mock.calls.map((c) => c[0])).toEqual([
      "/auth/mfa/totp/setup",
      "/auth/mfa/totp/enable",
      "/auth/mfa/totp/disable",
    ]);
  });
});
