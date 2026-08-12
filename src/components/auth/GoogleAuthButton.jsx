import { useEffect, useRef } from "react";
import { useGoogleOAuth } from "@react-oauth/google";
import { googleAuth } from "../../services/authService";
import { useAuth } from "../../store/AuthContext";
import { notifyError } from "../../utils/errorHandler";

const LABELS = {
  signin_with: "Sign in with Google",
  signup_with: "Sign up with Google",
  continue_with: "Continue with Google",
};

// Google's own rendered button (the old <GoogleLogin/> widget) lives inside
// a cross-origin iframe from accounts.google.com -- no CSS can ever reach
// inside it, only Google's own fixed shape/size presets ("rectangular" /
// "pill" / "circle", "large" / "medium" / "small"). That's why it could
// never be made to match this form's own rounded-xl inputs. Initializing
// Google Identity Services directly and triggering its One Tap prompt from
// a completely ordinary <button> keeps the button 100% ours while the
// `callback` below still hands the backend the exact same ID-token
// `credential` shape /auth/google already expects -- no backend change.
export default function GoogleAuthButton({ onAuthenticated, label = "continue_with" }) {
  const { setSession } = useAuth();
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const initializedRef = useRef(false);
  const onAuthenticatedRef = useRef(onAuthenticated);
  onAuthenticatedRef.current = onAuthenticated;

  useEffect(() => {
    if (!scriptLoadedSuccessfully || initializedRef.current) return;
    window.google?.accounts?.id?.initialize({
      client_id: clientId,
      callback: async (credentialResponse) => {
        if (!credentialResponse?.credential) {
          notifyError(new Error("Google didn't return a credential."), { context: "Google auth" });
          return;
        }
        try {
          const authData = await googleAuth({ clientToken: credentialResponse.credential });
          const user = await setSession(authData);
          onAuthenticatedRef.current?.(user);
        } catch (err) {
          notifyError(err, { context: "Google auth" });
        }
      },
      // Chrome is phasing out third-party cookies, which the classic One
      // Tap prompt relied on -- FedCM is Google's replacement transport and
      // is what keeps this working going forward instead of silently
      // failing to display.
      use_fedcm_for_prompt: true,
    });
    initializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once when the script/clientId are ready
  }, [clientId, scriptLoadedSuccessfully]);

  function handleClick() {
    if (!scriptLoadedSuccessfully) return;
    window.google?.accounts?.id?.prompt((notification) => {
      // FedCM fails closed (no callback, no error) when the prompt can't
      // display at all -- e.g. the user dismissed it recently, or third-
      // party sign-in is blocked. Without this the button would look
      // broken (click, nothing happens) with no explanation.
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        notifyError(
          new Error("Google sign-in didn't open. Please try again or use another sign-in method."),
          { context: "Google auth" },
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!scriptLoadedSuccessfully}
      className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 border-[1.5px] border-[#E0E0E6] bg-white text-button font-semibold text-gray-700 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <GoogleGlyph />
      {LABELS[label] ?? LABELS.continue_with}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="flex-shrink-0">
      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.5397-1.8368.8582-3.0477.8582-2.3436 0-4.3282-1.5827-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.9641 10.71c-.18-.5397-.2822-1.1159-.2822-1.71 0-.5941.1023-1.1705.2822-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.9641 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1623 6.6564 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}
