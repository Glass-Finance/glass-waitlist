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
export default function GoogleAuthButton({ onAuthenticated, label = "continue_with" }) {
  const { setSession } = useAuth();
  const containerRef = useRef(null);
  // Google's widget takes a fixed pixel width, not a percentage -- was
  // hardcoded to 320, so it rendered visibly narrower than the input
  // fields/Continue button (both w-full) once the form column widened past
  // 320px. Measuring the wrapper instead keeps it edge-to-edge with the
  // rest of the form on any screen size.
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = entry?.contentRect.width;
      if (measured) setWidth(Math.round(measured));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    <div ref={containerRef} className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleCredential}
        onError={() => notifyError(new Error("Google sign-in was cancelled or failed."), { context: "Google auth" })}
        text={label}
        shape="pill"
        width={String(width)}
      />
    </div>
  );
}
