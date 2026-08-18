import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// Storage key — single source of truth so other modules can import this
// rather than hardcoding the string.
// ---------------------------------------------------------------------------
export const INVITE_TOKEN_KEY = "glass_invite_token";

// ---------------------------------------------------------------------------
// useInviteToken
//
// Lifecycle:
//   1. On mount, read `?token=` from the URL.
//   2. If present, write it to sessionStorage (survives page refresh within
//      the tab, gone when the tab closes — intentional: invite links are
//      single-session by design).
//   3. Expose `token` (string | null) and `consumeToken` to callers.
//
// Usage in Join:
//   const { token, consumeToken } = useInviteToken();
//   // on successful register → consumeToken() clears it from storage
//
// Usage in any component that just needs to read:
//   const { token } = useInviteToken();
// ---------------------------------------------------------------------------
export function useInviteToken() {
  const [searchParams, setSearchParams] = useSearchParams();
  const didPersist = useRef(false);

  useEffect(() => {
    if (didPersist.current) return; // run once per mount
    didPersist.current = true;

    const urlToken = searchParams.get("token");

    if (urlToken) {
      // Persist to sessionStorage so the token survives the OTP redirect
      // without staying in the URL (avoids accidental sharing via copy-paste).
      sessionStorage.setItem(INVITE_TOKEN_KEY, urlToken);

      // Strip the token from the URL without adding a history entry.
      // The user sees a clean URL; the Back button still works correctly.
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("token");
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Read the current invite token.
   * Returns null if no invite token is present (i.e. organic signup).
   *
   * Checks the URL param first, sessionStorage second: on the very first
   * render of a mount that just arrived with ?token=, the effect above
   * (which persists it to sessionStorage) hasn't run yet -- effects always
   * fire after the render that scheduled them, never during it. A caller
   * that only reads sessionStorage here would see an empty token on that
   * first render. That's invisible to anything that re-renders on its own
   * (the persist effect's setSearchParams triggers one, so a plain re-render
   * self-corrects) but breaks any caller that captures this value once and
   * never re-derives it -- e.g. a `useState(() => ...)` lazy initializer,
   * which only ever runs on that first, still-stale render (see Join/index.jsx's
   * `step` initializer, which hit exactly this).
   */
  const token = searchParams.get("token") ?? sessionStorage.getItem(INVITE_TOKEN_KEY);

  /**
   * Call this after a successful registration API call.
   * Clears the token from sessionStorage so it cannot be reused
   * within the same tab session.
   */
  function consumeToken() {
    sessionStorage.removeItem(INVITE_TOKEN_KEY);
  }

  /**
   * Utility: returns true if the current signup is invite-gated.
   * Useful for conditionally showing "You were invited by…" UI.
   */
  const hasToken = token !== null;

  return { token, consumeToken, hasToken };
}