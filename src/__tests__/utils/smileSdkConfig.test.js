import { describe, it, expect } from "vitest";
import {
  SMILE_KYC_PRODUCT,
  buildSmileConfig,
  missingSmileOptions,
  validateSmileConfig,
} from "../../utils/smileSdkConfig";

const TOKEN = "capture-token";
const CALLBACK_URL = "https://api.glasspay.app/api/v1/webhooks/smile-id";

// A complete, valid deployment. Individual tests delete or blank one key.
function env(overrides = {}) {
  return {
    VITE_SMILE_ENV: "sandbox",
    VITE_SMILE_PARTNER_ID: "partner-123",
    VITE_SMILE_LOGO_URL: "https://cdn.glasspay.app/brand/glass-logo.png",
    VITE_SMILE_PARTNER_NAME: "Glass",
    VITE_SMILE_POLICY_URL: "https://glasspay.app/privacy",
    VITE_SMILE_THEME_COLOR: "#002FA7",
    ...overrides,
  };
}

function config() {
  return buildSmileConfig({ token: TOKEN, callbackUrl: CALLBACK_URL, env: env() });
}

describe("buildSmileConfig", () => {
  it("assembles the full required option set", () => {
    expect(config()).toEqual({
      token: TOKEN,
      callback_url: CALLBACK_URL,
      product: "biometric_kyc",
      environment: "sandbox",
      partner_details: {
        name: "Glass",
        logo_url: "https://cdn.glasspay.app/brand/glass-logo.png",
        partner_id: "partner-123",
        policy_url: "https://glasspay.app/privacy",
        theme_color: "#002FA7",
      },
    });
  });

  it("pins the biometric KYC product the SDK's partner_details rules apply to", () => {
    expect(config().product).toBe(SMILE_KYC_PRODUCT);
  });

  it('leaves logo_url and partner_id undefined when unset, never ""', () => {
    // The regression: `?? ""` made a missing env var indistinguishable from a
    // configured one, and the SDK rejects "" as hard as it rejects a missing key.
    const built = buildSmileConfig({
      token: TOKEN,
      callbackUrl: CALLBACK_URL,
      env: env({ VITE_SMILE_LOGO_URL: undefined, VITE_SMILE_PARTNER_ID: undefined }),
    });

    expect(built.partner_details.logo_url).toBeUndefined();
    expect(built.partner_details.partner_id).toBeUndefined();
  });

  it("keeps real defaults for the optional partner details", () => {
    const built = buildSmileConfig({
      token: TOKEN,
      callbackUrl: CALLBACK_URL,
      env: { VITE_SMILE_LOGO_URL: "https://cdn.glasspay.app/logo.png", VITE_SMILE_PARTNER_ID: "p" },
    });

    expect(built.partner_details.name).toBe("Glass");
    expect(built.partner_details.theme_color).toBe("#002FA7");
    expect(built.partner_details.policy_url).toBe("/legal/privacy-policy");
  });

  it("maps the environment to only the two values the SDK accepts", () => {
    const at = (value) =>
      buildSmileConfig({
        token: TOKEN,
        callbackUrl: CALLBACK_URL,
        env: env({ VITE_SMILE_ENV: value }),
      }).environment;

    expect(at("production")).toBe("production");
    expect(at("PRODUCTION")).toBe("production");
    expect(at("sandbox")).toBe("sandbox");
    expect(at("staging")).toBe("sandbox");
    expect(at(undefined)).toBe("sandbox");
  });
});

describe("missingSmileOptions", () => {
  it("reports nothing for a complete configuration", () => {
    expect(missingSmileOptions(config())).toEqual([]);
  });

  it.each([
    ["token", "capture token", { token: undefined }],
    ["callback_url", "callback URL", { callbackUrl: undefined }],
  ])("reports a missing %s", (_label, expected, overrides) => {
    const built = buildSmileConfig({
      token: TOKEN,
      callbackUrl: CALLBACK_URL,
      env: env(),
      ...overrides,
    });
    expect(missingSmileOptions(built)).toEqual([expected]);
  });

  it.each([
    ["VITE_SMILE_LOGO_URL", "VITE_SMILE_LOGO_URL"],
    ["VITE_SMILE_PARTNER_ID", "VITE_SMILE_PARTNER_ID"],
  ])("reports an unset %s by its env var name", (envKey, expected) => {
    // The two partner details with no code default — the only ones a deployment
    // can genuinely get wrong, and the two the `?? ""` footgun papered over.
    const built = buildSmileConfig({
      token: TOKEN,
      callbackUrl: CALLBACK_URL,
      env: env({ [envKey]: undefined }),
    });

    expect(missingSmileOptions(built)).toEqual([expected]);
  });

  it.each([
    ["name", "VITE_SMILE_PARTNER_NAME"],
    ["logo_url", "VITE_SMILE_LOGO_URL"],
    ["partner_id", "VITE_SMILE_PARTNER_ID"],
    ["policy_url", "VITE_SMILE_POLICY_URL"],
    ["theme_color", "VITE_SMILE_THEME_COLOR"],
  ])("reports a blank partner_details.%s by its env var name", (key, expected) => {
    // All five are required by the SDK, including the three `buildSmileConfig`
    // can default — the validator must still catch them if a default goes away.
    const built = config();
    built.partner_details[key] = "";

    expect(missingSmileOptions(built)).toEqual([expected]);
  });

  it("reports an absent partner_details object as every key inside it", () => {
    expect(
      missingSmileOptions({ token: TOKEN, callback_url: CALLBACK_URL, product: "biometric_kyc" }),
    ).toEqual([
      "VITE_SMILE_PARTNER_NAME",
      "VITE_SMILE_LOGO_URL",
      "VITE_SMILE_PARTNER_ID",
      "VITE_SMILE_POLICY_URL",
      "VITE_SMILE_THEME_COLOR",
    ]);
  });

  it("reports a missing product", () => {
    expect(missingSmileOptions({ ...config(), product: undefined })).toEqual(["product"]);
  });

  it("treats whitespace-only required values as missing", () => {
    const built = buildSmileConfig({
      token: "   ",
      callbackUrl: CALLBACK_URL,
      env: env({ VITE_SMILE_LOGO_URL: "  ", VITE_SMILE_PARTNER_ID: "\t" }),
    });

    expect(missingSmileOptions(built)).toEqual([
      "capture token",
      "VITE_SMILE_LOGO_URL",
      "VITE_SMILE_PARTNER_ID",
    ]);
  });

  it("treats empty strings, null and undefined alike", () => {
    const built = buildSmileConfig({
      token: TOKEN,
      callbackUrl: CALLBACK_URL,
      env: env({ VITE_SMILE_LOGO_URL: "", VITE_SMILE_PARTNER_ID: null }),
    });

    expect(missingSmileOptions(built)).toEqual(["VITE_SMILE_LOGO_URL", "VITE_SMILE_PARTNER_ID"]);
  });

  it("names every missing option at once, so one deploy fixes them all", () => {
    // The point of pre-flight validation: the SDK would have reported logo_url
    // alone and left partner_id to be discovered only after the next fix.
    const built = buildSmileConfig({ token: TOKEN, callbackUrl: CALLBACK_URL, env: {} });

    expect(missingSmileOptions(built)).toEqual(["VITE_SMILE_LOGO_URL", "VITE_SMILE_PARTNER_ID"]);
  });

  it("does not require the optional user_details and consent_information objects", () => {
    // Both are legal omissions: the SDK validates them only when present, Glass's
    // token already carries the member's names and contact details, and there is
    // no consent surface that could honestly back a `granted: true`.
    const built = config();

    expect(built.user_details).toBeUndefined();
    expect(built.consent_information).toBeUndefined();
    expect(missingSmileOptions(built)).toEqual([]);
  });
});

describe("validateSmileConfig", () => {
  it("returns the config untouched when complete", () => {
    const built = config();
    expect(validateSmileConfig(built)).toBe(built);
  });

  it("throws once naming every missing option, and never a value", () => {
    expect(() =>
      validateSmileConfig(buildSmileConfig({ token: TOKEN, callbackUrl: CALLBACK_URL, env: {} })),
    ).toThrow(/VITE_SMILE_LOGO_URL, VITE_SMILE_PARTNER_ID/);
  });

  it("never leaks a configured value into the error", () => {
    let message = "";
    try {
      validateSmileConfig(
        buildSmileConfig({
          token: TOKEN,
          callbackUrl: CALLBACK_URL,
          env: { VITE_SMILE_PARTNER_ID: "partner-secret-value" },
        }),
      );
    } catch (error) {
      message = error.message;
    }

    expect(message).toContain("VITE_SMILE_LOGO_URL");
    expect(message).not.toContain("partner-secret-value");
  });
});
