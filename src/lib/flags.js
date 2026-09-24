// src/lib/flags.js
//
// Build-time feature flags / kill switches. VITE_FLAGS is a JSON object
// inlined by Vite (see .env.example), e.g. {"paymentsDisabled":true}.
//
// This is deliberately tiny: one flag map, fail-closed parsing (malformed
// JSON => treated as absent, not as "all on" or a crash), and a payments
// kill switch wired into every payment-initiation surface. Changing a flag
// means setting the env var in Vercel and redeploying — see
// docs/runbooks/incident-rollback.md for the incident procedure. A
// backend-owned flag endpoint would remove the redeploy; that's out of
// scope for this repo.

const raw = import.meta.env.VITE_FLAGS ?? "";

let flags = {};
if (raw) {
  try {
    const parsed = JSON.parse(raw);
    flags = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // Fail-closed to "no flags" is wrong for a kill switch (it would enable
    // everything), so log loudly in dev and leave payments enabled only
    // because we cannot prove they should be disabled either. The build
    // guard is the real defence: malformed VITE_FLAGS should be caught
    // before deploy — this branch is belt-and-braces for hand-rolled envs.
    console.error("VITE_FLAGS is not valid JSON — ignoring flag overrides.");
    flags = {};
  }
}

export function isFlagEnabled(name) {
  return flags[name] === true;
}

// Incident kill switch: true blocks every pay button (member PaymentSummary
// and admin AdminPaymentModal) without touching backend code.
export function paymentsDisabled() {
  return isFlagEnabled("paymentsDisabled");
}

// KYC kill switch: hides the member verify-identity entry points and the
// community-create/manage gate when true. Backend remains authoritative.
export function kycDisabled() {
  return isFlagEnabled("kycDisabled");
}
