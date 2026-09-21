import { describe, it, expect } from "vitest";
import {
  identifierPayload,
  buildRegisterPayload,
  buildPasswordResetPayload,
  buildPasswordUpdatePayload,
} from "../../services/authPayloads";
import { isEmailAlreadyRegisteredError } from "../../services/authService";

describe("identifierPayload", () => {
  it("builds an email identifier without phone fields", () => {
    expect(identifierPayload({ email: "a@b.c", phoneNumber: "0803" })).toEqual({ email: "a@b.c" });
  });

  it("builds a phone identifier, including phoneRegion only when provided", () => {
    expect(identifierPayload({ phoneNumber: "+234803" })).toEqual({ phoneNumber: "+234803" });
    expect(identifierPayload({ phoneNumber: "+234803", phoneRegion: "NG" })).toEqual({
      phoneNumber: "+234803",
      phoneRegion: "NG",
    });
  });
});

describe("buildRegisterPayload", () => {
  it("sends the backend RegisterRequest shape with no inviteToken or confirmPassword", () => {
    expect(
      buildRegisterPayload({
        email: "a@b.c",
        firstName: "Ada",
        lastName: "Okafor",
        password: "Secret123!",
      }),
    ).toEqual({ email: "a@b.c", firstName: "Ada", lastName: "Okafor", password: "Secret123!" });
  });

  it("preserves phoneNumber + phoneConfirmToken when a verified number exists", () => {
    const payload = buildRegisterPayload({
      email: "a@b.c",
      firstName: "Ada",
      lastName: "Okafor",
      password: "Secret123!",
      phoneNumber: "+234803",
      phoneConfirmToken: "ct",
    });
    expect(payload).toEqual({
      email: "a@b.c",
      firstName: "Ada",
      lastName: "Okafor",
      password: "Secret123!",
      phoneNumber: "+234803",
      phoneConfirmToken: "ct",
    });
  });

  it("omits optional phone fields and region when absent", () => {
    const payload = buildRegisterPayload({
      email: "a@b.c",
      firstName: "A",
      lastName: "B",
      password: "Secret123!",
    });
    expect("phoneNumber" in payload).toBe(false);
    expect("phoneConfirmToken" in payload).toBe(false);
    expect("phoneRegion" in payload).toBe(false);
    expect("inviteToken" in payload).toBe(false);
    expect("confirmPassword" in payload).toBe(false);
  });
});

describe("buildPasswordResetPayload", () => {
  it("keeps identifier + token + newPassword + confirmPassword (all backend-required)", () => {
    expect(
      buildPasswordResetPayload({
        email: "a@b.c",
        token: "t",
        newPassword: "New12345!",
        confirmPassword: "New12345!",
      }),
    ).toEqual({
      email: "a@b.c",
      token: "t",
      newPassword: "New12345!",
      confirmPassword: "New12345!",
    });
  });
});

describe("buildPasswordUpdatePayload", () => {
  it("sends the exact PATCH /user/password contract", () => {
    expect(
      buildPasswordUpdatePayload({ oldPassword: "o", newPassword: "n", confirmPassword: "n" }),
    ).toEqual({ oldPassword: "o", newPassword: "n", confirmPassword: "n" });
  });
});

describe("isEmailAlreadyRegisteredError", () => {
  it("matches the backend 400 duplicate-email response (message in description)", () => {
    const err = {
      response: {
        status: 400,
        data: {
          success: false,
          message: "error",
          description: "Email is already registered",
          status: "BAD_REQUEST",
        },
      },
    };
    expect(isEmailAlreadyRegisteredError(err)).toBe(true);
  });

  it("rejects 409s, other 400s, and network errors", () => {
    expect(isEmailAlreadyRegisteredError({ response: { status: 409, data: {} } })).toBe(false);
    expect(
      isEmailAlreadyRegisteredError({
        response: { status: 400, data: { description: "Password fields are not matching" } },
      }),
    ).toBe(false);
    expect(isEmailAlreadyRegisteredError(new Error("nope"))).toBe(false);
    expect(isEmailAlreadyRegisteredError(null)).toBe(false);
  });
});
