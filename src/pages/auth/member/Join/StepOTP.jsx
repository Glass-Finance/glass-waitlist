import { useState, useEffect } from "react";
import { verifyEmail, resendVerification } from "../../../../services/authService";
import { notifyError } from "../../../../utils/errorHandler";
import OtpBoxes from "../../../../components/common/OtpBoxes";
import { useCountdown, formatCountdown } from "../../../../hooks/useCountdown";
import { Button as PrimaryButton } from "../../../../components/ui/Button";
import { ErrorMessage, renderDashedOtpBoxes } from "./shared";
import { OTP_LENGTH, OTP_VALIDITY_SECONDS, PENDING_KEY } from "./constants";

// ---------------------------------------------------------------------------
// Step 3 — OTP  (6 boxes with dash in middle like Figma)
// ---------------------------------------------------------------------------
export default function StepOTP({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  // Separate from resendCount (which drives the 15-min expiry countdown
  // below and must only change on an actual resend) — this only forces
  // OtpBoxes to remount so autoFocus re-fires after clearing the boxes,
  // on either a resend or a failed verify attempt.
  const [otpAttempt, setOtpAttempt] = useState(0);

  const secondsLeft = useCountdown(OTP_VALIDITY_SECONDS, `${email}-${resendCount}`);
  const codeExpired = secondsLeft <= 0;

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
      const result = await verifyEmail({ email, token: code });
      sessionStorage.removeItem(PENDING_KEY);
      onVerified(result);
    } catch (err) {
      setError(notifyError(err, { context: "Verify OTP", fallback: "That code didn't work. Please try again.", silent: true }));
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpAttempt((a) => a + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    setError("");
    try {
      await resendVerification({ email });
      setResendCount((c) => c + 1);
      setOtpAttempt((a) => a + 1);
      setDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setError(notifyError(err, { context: "Resend OTP", fallback: "Could not resend. Please try again.", silent: true }));
    }
  }

  const allFilled = digits.every(Boolean);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-headline text-gray-900 mb-5">
          Verification Code Sent
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          Enter the 6-digit code sent to
        </p>
        <p className="font-semibold text-sm text-gray-900 mb-1">{email}</p>
        <button
          onClick={() => { sessionStorage.removeItem(PENDING_KEY); onBack(); }}
          className="text-sm font-medium mt-1 text-[#1C2B8A]"
        >
          Wrong email?
        </button>
        <p className={`text-xs mt-2 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
          {codeExpired
            ? "Your code has expired — request a new one below."
            : `Code expires in ${formatCountdown(secondsLeft)}`}
        </p>
      </div>

      {/* Spam notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Can't find the email?</span> Check your spam or junk folder — emails from Yahoo addresses often end up there. If the code has expired, tap <span className="font-semibold">Resend</span> to get a new one. If you accidentally closed this page and came back, you can enter the original code if it's still within 15 minutes, or resend to get a fresh one.
        </p>
      </div>

      {/* Wrapping in a real <form> matches WebKit's own documented pattern
          for autocomplete="one-time-code" and gets the iOS keyboard's
          Return/Go key to submit for free. The "Resend" button below stays
          outside this form — see the note above it. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (allFilled && !codeExpired) handleVerify();
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

      <PrimaryButton onClick={handleVerify} loading={loading} disabled={!allFilled || codeExpired}>
        {loading ? "Verifying..." : "Continue"}
      </PrimaryButton>
      </form>

      {/* Deliberately outside the <form>: a bare <button> with no explicit
          type defaults to type="submit" inside a form, which would have
          triggered the form's onSubmit (and double-fired handleVerify) on
          click. */}
      <p className="text-sm text-center text-gray-500 pb-2">
        Didn't get OTP?{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-semibold disabled:opacity-40 text-[#1C2B8A]"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
        </button>
      </p>
    </div>
  );
}
