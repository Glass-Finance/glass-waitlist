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
 * onAuthenticated(user) is called after the session is stored, so each page
 * can decide its own post-auth navigation (role-based redirect, resume an
 * invite, etc.) without this component knowing about routing.
 */
export default function GoogleAuthButton({ onAuthenticated, label = "continue_with" }) {
  const { setSession, refreshUser } = useAuth();

  async function handleCredential(credentialResponse) {
    if (!credentialResponse?.credential) {
      notifyError(new Error("Google didn't return a credential."), { context: "Google auth" });
      return;
    }
    try {
      const authData = await googleAuth({ clientToken: credentialResponse.credential });
      const user = await setSession(authData);
      refreshUser(); // fire-and-forget — keeps context's user in sync too
      onAuthenticated?.(user);
    } catch (err) {
      notifyError(err, { context: "Google auth" });
    }
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleCredential}
        onError={() => notifyError(new Error("Google sign-in was cancelled or failed."), { context: "Google auth" })}
        text={label}
        shape="pill"
        width="320"
      />
    </div>
  );
}
