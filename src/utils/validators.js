// Shared, form-agnostic field validators — was duplicated as the same
// inline regex (/^[^\s@]+@[^\s@]+\.[^\s@]+$/) across SignIn, SignUp,
// ForgotPassword, OrganizationProfile, and dashboard Profile, each unable
// to catch a mistyped domain since a bare format check treats
// "x@igamil.com" as perfectly valid.

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Providers common enough that a close-but-not-exact domain is far more
// likely a typo ("gmial.com") than someone's genuine, deliberately-chosen
// address at a similarly-spelled but different domain.
const TYPO_CHECK_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
  "icloud.com", "protonmail.com", "yandex.com",
];

// Accepted outright, but short enough (or unusual enough) that fuzzy-
// matching against them risks flagging real, unrelated domains as typos.
// ymail.com in particular is Yahoo's own alternate domain, not a typo of
// yahoo.com — and mail.com/email.com are real, independent providers that
// just happen to be a one-letter edit away from gmail.com.
const OTHER_KNOWN_DOMAINS = [
  "aol.com", "live.com", "zoho.com", "gmail.co.uk", "yahoo.co.uk",
  "ymail.com", "mail.com", "email.com", "rocketmail.com", "fastmail.com",
];

// Optimal-string-alignment distance: Levenshtein plus adjacent-transposition
// as a single edit ("ligamil" vs "gmail") instead of pricing a swap as two
// substitutions — plain Levenshtein badly undervalues exactly this class of
// typo, which is one of the most common ways people fat-finger a domain.
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (
        i > 1 && j > 1 &&
        a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

// Returns "" if the email is acceptable, or a user-facing message
// otherwise — including a "Did you mean gmail.com?" suggestion when the
// domain is a near-miss (edit distance 1-2) on a well-known provider,
// since that's almost always a typo rather than a real different domain.
export function getEmailError(value) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_FORMAT_RE.test(trimmed)) return "Enter a valid email address.";

  const domain = trimmed.split("@")[1]?.toLowerCase();
  if (!domain) return "Enter a valid email address.";
  if (TYPO_CHECK_DOMAINS.includes(domain) || OTHER_KNOWN_DOMAINS.includes(domain)) return "";

  let closest = null;
  let closestDist = Infinity;
  for (const known of TYPO_CHECK_DOMAINS) {
    const dist = editDistance(domain, known);
    if (dist < closestDist) { closestDist = dist; closest = known; }
  }
  if (closest && closestDist > 0 && closestDist <= 2) {
    return `Enter a valid email address — did you mean "${closest}"?`;
  }
  return "";
}

export function isValidEmail(value) {
  return getEmailError(value) === "";
}
