import { useRef, useState } from "react";
import { verifyMfaLogin } from "../services/authService";
import { notifyError } from "../utils/errorHandler";

// MFA challenge state + verification, as previously inline in SignIn.jsx.
// The body is unchanged; session establishment and routing are injected so
// the hook stays router/session independent:
//   onAuthAttempt()             — called at the top of handleMfaVerify, BEFORE
//                                 the request, so the page can disarm its
//                                 pre-auth redirect effect. Not the same as
//                                 onAuthenticated: by the time the session
//                                 exists the guard is too late.
//   onAuthenticated(authData)   — establish the session and route onward
// setLoading/setError are SignIn's shared form state (the MFA screen
// shares the password form's loading indicator and error slot).
export function useMfaChallenge({ setLoading, setError, onAuthAttempt, onAuthenticated }) {
  // Set after login() returns mfaRequired: true
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaChallengeToken }
  const [mfaCode, setMfaCode] = useState("");
  const mfaInputRef = useRef(null);

  async function handleMfaVerify() {
    if (mfaCode.length !== 6) return;
    onAuthAttempt();
    setLoading(true);
    setError("");
    try {
      const authData = await verifyMfaLogin({
        challengeToken: mfaChallenge.mfaChallengeToken,
        code: mfaCode,
      });
      await onAuthenticated(authData);
    } catch (err) {
      setError(
        notifyError(err, {
          context: "MFA verification",
          fallback: "Invalid code. Please try again.",
        }),
      );
      setMfaCode("");
      mfaInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return { mfaChallenge, setMfaChallenge, mfaCode, setMfaCode, mfaInputRef, handleMfaVerify };
}
