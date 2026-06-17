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
// Usage in MobileSignUp:
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
   */
  const token = sessionStorage.getItem(INVITE_TOKEN_KEY);

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