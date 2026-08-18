import { useState, useEffect, useRef } from "react";
import { requestLoginOtp, verifyLoginOtp } from "../../../../services/authService";
import { notifyError } from "../../../../utils/errorHandler";
import OtpBoxes from "../../../../components/common/OtpBoxes";
import { useCountdown, formatCountdown } from "../../../../hooks/useCountdown";
import { Button as PrimaryButton } from "../../../../components/ui/Button";
import { ErrorMessage, renderDashedOtpBoxes } from "./shared";
import { OTP_LENGTH } from "./constants";

// ---------------------------------------------------------------------------
// Step — Sign in via code. Not part of the linear CONTACT -> PHONE_OTP ->
// PROFILE -> OTP flow above -- entered directly (see Join()'s initial step
// selection) when arriving via CheckEmail.jsx's QR (?email=, no invite
// token). That person already has a full, verified account from SignUp.jsx's
// own register+OTP a moment earlier, just no client-side session yet.
// Routing them through registration again would only earn a 409 after
// they've already typed a name and password for nothing (see StepProfile's
// accountExists handling), passwordless login OTP, the same
// requestLoginOtp/verifyLoginOtp SignIn.jsx already uses, signs them in
// directly instead.
// ---------------------------------------------------------------------------
export default function StepSignInOtp({ email, onVerified, onUseDifferentEmail }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [otpAttempt, setOtpAttempt] = useState(0);
  // StrictMode double-invokes effects in dev, which would otherwise fire two
  // real OTP sends off a single mount -- same guard shape as
  // useInviteToken/useJoinCommunityParam use for their own once-per-mount work.
  const didAutoSend = useRef(false);

  const secondsLeft = useCountdown(expirySeconds, `${email}-${resendCount}`);
  // Guarded on resendCount so this doesn't read as "expired" before the
  // very first send (expirySeconds/secondsLeft both start at 0).
  const codeExpired = resendCount > 0 && secondsLeft <= 0;

  async function sendCode() {
    setSending(true);
    setError("");
    try {
      const result = await requestLoginOtp({ email });
      const seconds = Math.max(0, Math.round((new Date(result.expiresAt) - Date.now()) / 1000));
      setExpirySeconds(seconds);
      setResendCount((c) => c + 1);
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpAttempt((a) => a + 1);
    } catch (err) {
      setError(notifyError(err, { context: "Send login code", silent: true }));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (didAutoSend.current) return;
    didAutoSend.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  function handleDigitChange(next) {
    setDigits(next);
    setError("");
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await verifyLoginOtp({ email, token: code });
      if (result?.mfaRequired) {
        // This step's only audience is a brand-new account (see the
        // component comment above), which can't have MFA configured yet in
        // practice -- a defensive message instead of a built-out challenge
        // screen, pointing at the one place that already handles it.
        setError("This account has extra security enabled. Please use the full sign-in page to continue.");
        return;
      }
      onVerified(result);
    } catch (err) {
      setError(notifyError(err, { context: "Verify login code", fallback: "That code didn't work. Please try again.", silent: true }));
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpAttempt((a) => a + 1);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    sendCode();
  }

  const allFilled = digits.every(Boolean);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-headline text-gray-900 mb-5">
          You Already Have An Account
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          {sending ? "Sending a sign-in code to" : "Enter the 6-digit code sent to"}
        </p>
        <p className="font-semibold text-sm text-gray-900 mb-1">{email}</p>
        <button
          onClick={onUseDifferentEmail}
          className="text-sm font-medium mt-1 text-[#1C2B8A]"
        >
          Not you?
        </button>
        {resendCount > 0 && (
          <p className={`text-xs mt-2 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {codeExpired
              ? "Your code has expired — request a new one below."
              : `Code expires in ${formatCountdown(secondsLeft)}`}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (allFilled && !codeExpired && !sending) handleVerify();
        }}
        className="flex flex-col gap-6"
      >
        <OtpBoxes
          key={otpAttempt}
          value={digits}
          onChange={handleDigitChange}
          length={OTP_LENGTH}
          autoFocus
          renderBoxes={renderDashedOtpBoxes}
        />

        <ErrorMessage message={error} />

        <PrimaryButton onClick={handleVerify} loading={loading} disabled={!allFilled || codeExpired || sending}>
          {loading ? "Verifying..." : "Continue"}
        </PrimaryButton>
      </form>

      <p className="text-sm text-center text-gray-500 pb-2">
        Didn't get a code?{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || sending}
          className="font-semibold disabled:opacity-40 text-[#1C2B8A]"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
        </button>
      </p>
    </div>
  );
}
