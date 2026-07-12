// Persists in-progress onboarding data across a forced re-login or an
// accidental reload. React Router's `location.state` -- what every
// onboarding page currently relies on exclusively -- doesn't survive
// either of those. That's a bigger problem than losing typed-out form
// fields: OrganizationProfile's submit actually creates the community via
// the API before navigating on, so once that's happened, losing the state
// link leaves a real, half-configured community on the backend with no
// way back to it short of contacting support -- the next two steps have
// no fallback if location.state is empty, they just error out or silently
// no-op with an undefined communityId.
//
// sessionStorage (not localStorage): this is scoped to finishing the
// onboarding flow in this tab, not something that should persist forever
// or leak into a later, unrelated attempt.
const KEY = "glass_onboarding_progress";

export function saveOnboardingProgress(patch) {
  try {
    const existing = JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
    sessionStorage.setItem(KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {
    /* ignore -- storage unavailable, onboarding still works, just without recovery */
  }
}

export function readOnboardingProgress() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function clearOnboardingProgress() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
