/**
 * Smile Identity Web SDK configuration for `biometric_kyc`.
 *
 * The SDK validates its options synchronously and throws on the FIRST missing
 * required field, so an unset env var used to reach production and surface as a
 * bare provider message that only the deploy could act on ("SmileIdentity:
 * Please include logo_url in the "partner_details" object"). `validateSmileConfig`
 * checks the whole required set before we hand anything to the SDK, so one
 * failure names every absent key instead of the next one in line.
 *
 * Required set read from the v12 SDK this app pins
 * (cdn.usesmileid.com/inline/v12/js/script.min.js): `token`, `callback_url`,
 * `product`, and all five `partner_details` keys. `user_details` and
 * `consent_information` are deliberately NOT here — the SDK validates those
 * only when they are present, and Glass's capture token already carries the
 * member's names and contact details (see docs/kyc.md).
 */

export const SMILE_KYC_PRODUCT = "biometric_kyc";

/**
 * Required option paths, paired with the name an operator has to fix. Keys are
 * the `VITE_*` variable when one exists, so the message is actionable without
 * ever echoing a value. Order is the order the SDK itself checks them.
 */
const REQUIRED_OPTIONS = [
  ["token", "capture token"],
  ["callback_url", "callback URL"],
  ["product", "product"],
  ["partner_details.name", "VITE_SMILE_PARTNER_NAME"],
  ["partner_details.logo_url", "VITE_SMILE_LOGO_URL"],
  ["partner_details.partner_id", "VITE_SMILE_PARTNER_ID"],
  ["partner_details.policy_url", "VITE_SMILE_POLICY_URL"],
  ["partner_details.theme_color", "VITE_SMILE_THEME_COLOR"],
];

/** The SDK's own check is falsy-based; treat whitespace-only as absent too. */
function isMissing(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function readPath(source, path) {
  return path.split(".").reduce((value, key) => (value == null ? value : value[key]), source);
}

/**
 * Build the SDK option bag from a capture token plus build-time config.
 *
 * `logo_url` and `partner_id` are read raw on purpose: they have no safe
 * default, and a `?? ""` here used to make "unset" look like a configured
 * value — the SDK rejects an empty string exactly as hard as a missing key, so
 * the mistake was invisible until the capture step threw.
 *
 * @param {object} [input]
 * @param {string} [input.token] capture token minted by Glass (POST /kyc/attempts)
 * @param {string} [input.callbackUrl] result webhook the SDK posts to
 * @param {Record<string, string>} [input.env] build-time env, injectable for tests
 * @returns {object} options for `window.SmileIdentity(...)`, minus the callbacks
 */
export function buildSmileConfig({ token, callbackUrl, env = import.meta.env } = {}) {
  const environment = (env.VITE_SMILE_ENV ?? "sandbox").toLowerCase();
  return {
    token,
    callback_url: callbackUrl,
    product: SMILE_KYC_PRODUCT,
    environment: environment === "production" ? "production" : "sandbox",
    partner_details: {
      name: env.VITE_SMILE_PARTNER_NAME ?? "Glass",
      logo_url: env.VITE_SMILE_LOGO_URL,
      partner_id: env.VITE_SMILE_PARTNER_ID,
      policy_url: env.VITE_SMILE_POLICY_URL ?? `${env.VITE_APP_URL ?? ""}/legal/privacy-policy`,
      theme_color: env.VITE_SMILE_THEME_COLOR ?? "#002FA7",
    },
  };
}

/**
 * Names of every required option that is absent or blank, in `REQUIRED_OPTIONS`
 * order. Empty array means the SDK is safe to call.
 *
 * @param {object} config a value built by `buildSmileConfig`
 * @returns {string[]}
 */
export function missingSmileOptions(config) {
  return REQUIRED_OPTIONS.filter(([path]) => isMissing(readPath(config, path))).map(
    ([, name]) => name,
  );
}

/**
 * Throw a single actionable error when required config is missing, otherwise
 * return the config unchanged so the caller can spread it straight into the
 * SDK call.
 *
 * @param {object} config a value built by `buildSmileConfig`
 * @returns {object} `config`
 * @throws {Error} naming every missing option
 */
export function validateSmileConfig(config) {
  const missing = missingSmileOptions(config);
  if (missing.length > 0) {
    throw new Error(
      `Identity verification is unavailable right now (missing: ${missing.join(", ")}). Please contact support.`,
    );
  }
  return config;
}
