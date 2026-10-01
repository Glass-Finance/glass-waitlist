import { useRef, useState } from "react";
import { verifyMfaLogin, verifyMfaRecoveryCodeLogin } from "../services/authService";
import { notifyError } from "../utils/errorHandler";

// MFA challenge state + verification, as previously inline in SignIn.jsx.
// The TOTP body is unchanged; session establishment and routing are injected
// so the hook stays router/session independent:
//   onAuthAttempt()             — called at the top of handleMfaVerify, BEFORE
//                                 the request, so the page can disarm its
//                                 pre-auth redirect effect. Not the same as
//                                 onAuthenticated: by the time the session
//                                 exists the guard is too late.
//   onAuthenticated(authData)   — establish the session and route onward
// setLoading/setError are SignIn's shared form state (the MFA screen
// shares the password form's loading indicator and error slot).
//
// Two second factors share one challenge token: a 6-digit TOTP code, or one
// of the account's single-use recovery codes for someone who has lost their
// authenticator. `method` is which one the user is currently trying, and is
// driven entirely by this hook so the two inputs can't drift out of sync
// with the endpoint that will actually be called.
export function useMfaChallenge({ setLoading, setError, onAuthAttempt, onAuthenticated }) {
  // Set after login() returns mfaRequired: true
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaChallengeToken }
  const [mfaMethod, setMfaMethod] = useState("totp"); // "totp" | "recovery"
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const mfaInputRef = useRef(null);

  // Recovery codes are 16 alphanumeric characters, stored hashed in
  // normalised form. The backend normalises what it's sent the same way
  // (strips separators, uppercases) before comparing, so accept the dashed
  // form a user pasted from wherever they saved their codes and let the
  // length check run on the normalised value.
  const normalizedRecoveryCode = recoveryCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  // Only the active method's input gates the button, so a half-typed
  // recovery code can't enable "Verify" while the TOTP field is empty.
  const canVerify =
    mfaMethod === "totp" ? mfaCode.length === 6 : normalizedRecoveryCode.length === 16;

  // Switching factors must clear the other input and any stale error, or the
  // previous attempt's message would be shown against a field the user
  // hasn't touched yet.
  function switchMethod(next) {
    if (next === mfaMethod) return;
    setMfaMethod(next);
    setMfaCode("");
    setRecoveryCode("");
    setError("");
    setTimeout(() => mfaInputRef.current?.focus(), 50);
  }

  // Clear a consumed challenge. Called when the user backs out of the MFA
  // screen, so re-entering it later starts from a clean slate rather than a
  // challenge token the backend may already consider spent.
  function resetChallenge() {
    setMfaChallenge(null);
    setMfaMethod("totp");
    setMfaCode("");
    setRecoveryCode("");
  }

  async function handleMfaVerify() {
    if (!canVerify) return;
    onAuthAttempt();
    setLoading(true);
    setError("");
    try {
      const authData =
        mfaMethod === "recovery"
          ? await verifyMfaRecoveryCodeLogin({
              challengeToken: mfaChallenge.mfaChallengeToken,
              recoveryCode: normalizedRecoveryCode,
            })
          : await verifyMfaLogin({
              challengeToken: mfaChallenge.mfaChallengeToken,
              code: mfaCode,
            });
      await onAuthenticated(authData);
    } catch (err) {
      setError(
        notifyError(err, {
          context: mfaMethod === "recovery" ? "Recovery code verification" : "MFA verification",
          fallback:
            mfaMethod === "recovery"
              ? "That recovery code isn't valid. Each code can only be used once."
              : "Invalid code. Please try again.",
        }),
      );
      // Clear the field so a single-use recovery code that the backend
      // rejected isn't re-submitted on the next Enter press, and so a
      // half-consumed TOTP window doesn't auto-resend a stale code.
      if (mfaMethod === "recovery") setRecoveryCode("");
      else setMfaCode("");
      mfaInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return {
    mfaChallenge,
    setMfaChallenge,
    mfaMethod,
    switchMethod,
    mfaCode,
    setMfaCode,
    recoveryCode,
    setRecoveryCode,
    normalizedRecoveryCode,
    canVerify,
    resetChallenge,
    mfaInputRef,
    handleMfaVerify,
  };
}
