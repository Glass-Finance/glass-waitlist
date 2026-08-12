import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { googleAuth } from "../../services/authService";
import { useAuth } from "../../store/AuthContext";
import { notifyError } from "../../utils/errorHandler";

/**
 * Shared "Continue with Google" button used by RegisterStep, MobileSignUp,
 * and MobileSignIn — was duplicated three times as a purely decorative SVG
 * button with no onClick at all. Google's identity flow gives us an ID
 * token (the `credential` field), which already proves the user owns that
 * email, so there's no separate register-vs-sign-in distinction here: the
 * backend's /auth/google endpoint creates-or-finds the account in one call.
 *
 * onAuthenticated(user) is called after the session is stored, so each
 * page can decide its own post-auth navigation (role-based redirect,
 * resume an invite, etc.) without this component knowing about routing.
 */
// Google's widget only offers a "large"/"medium"/"small" size enum, not an
// arbitrary pixel height -- "large" still renders ~40-44px, visibly shorter
// than this form's 54-56px inputs/primary button. There's no prop for this,
// so instead this renders the widget at a smaller width, measures its own
// natural (pre-scale) height, then CSS-scales the whole thing up uniformly
// (not stretched) until it's TARGET_HEIGHT tall -- proportional, so the G
// logo/text don't distort, and the pre-scale width is chosen so the
// post-scale result exactly fills the container again. 46 (not the full
// 56px of the inputs/primary button) is deliberate: scaling all the way to
// 56 also blows up the G logo/text proportionally, since Google renders
// icon+text+background as one atomic unit -- 46 keeps them at a natural,
// non-oversized size while still reading as intentionally bigger than
// Google's raw default.
const TARGET_HEIGHT = 46;

export default function GoogleAuthButton({ onAuthenticated, label = "continue_with" }) {
  const { setSession } = useAuth();
  const containerRef = useRef(null);
  const scaleRef = useRef(null);
  // Google's widget takes a fixed pixel width, not a percentage -- was
  // hardcoded to 320, so it rendered visibly narrower than the input
  // fields/Continue button (both w-full) once the form column widened past
  // 320px. Measuring the wrapper instead keeps it edge-to-edge with the
  // rest of the form on any screen size.
  const [containerWidth, setContainerWidth] = useState(320);
  const [naturalHeight, setNaturalHeight] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = entry?.contentRect.width;
      if (measured) setContainerWidth(Math.round(measured));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Google's rendered height for a given `size` is independent of the width
  // passed in, so this only ever needs to measure once -- disconnecting
  // right after the first reading is load-bearing, not just tidy cleanup:
  // setting naturalHeight changes googleWidth below, which re-renders
  // GoogleLogin at a new width and re-fires this same observer, which
  // would set naturalHeight again and loop forever if left connected.
  useEffect(() => {
    const el = scaleRef.current;
    if (!el || naturalHeight != null) return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = entry?.contentRect.height;
      if (measured > 0) {
        setNaturalHeight(measured);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [naturalHeight]);

  const scale = naturalHeight ? TARGET_HEIGHT / naturalHeight : 1;
  const googleWidth = naturalHeight ? Math.round(containerWidth / scale) : containerWidth;

  async function handleCredential(credentialResponse) {
    if (!credentialResponse?.credential) {
      notifyError(new Error("Google didn't return a credential."), { context: "Google auth" });
      return;
    }
    try {
      const authData = await googleAuth({ clientToken: credentialResponse.credential });
      const user = await setSession(authData);
      onAuthenticated?.(user);
    } catch (err) {
      notifyError(err, { context: "Google auth" });
    }
  }

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center" style={{ height: TARGET_HEIGHT }}>
      <div ref={scaleRef} style={{ transform: `scale(${scale})` }}>
        <GoogleLogin
          onSuccess={handleCredential}
          onError={() => notifyError(new Error("Google sign-in was cancelled or failed."), { context: "Google auth" })}
          text={label}
          shape="pill"
          logo_alignment="center"
          size="large"
          width={String(googleWidth)}
        />
      </div>
    </div>
  );
}
