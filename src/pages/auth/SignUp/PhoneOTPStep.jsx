import { useEffect, useRef, useState } from "react";
import { requestPhoneOtp, verifyPhoneOtp } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";
import { useCountdown, formatCountdown } from "../../../hooks/useCountdown";
import OtpBoxes from "../../../components/common/OtpBoxes";
import { Button } from "../../../components/ui/Button";

// Codes are valid for 15 minutes (see the same figure quoted in OTPStep.jsx).
const OTP_VALIDITY_SECONDS = 15 * 60;

// Registration-time phone verification -- distinct from PhoneChangeModal
// (which confirms an already-signed-in user's number change). This step
// fires POST /auth/phone/request-otp itself on mount (registration's OTP
// send isn't triggered by any earlier step, unlike email verification which
// piggybacks on register() already having been called), then verifies via
// POST /auth/phone/verify-otp, which returns the confirmToken register()
// needs.
export default function PhoneOTPStep({ phone, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const sentOnce = useRef(false);

  const secondsLeft = useCountdown(OTP_VALIDITY_SECONDS, `${phone}-${resendCount}`);
  const codeExpired = secondsLeft <= 0;

  useEffect(() => {
    // Guard against firing twice under StrictMode's dev double-invoke.
    if (sentOnce.current) return;
    sentOnce.current = true;
    (async () => {
      try {
        await requestPhoneOtp({ phoneNumber: phone });
      } catch (err) {
        setError(notifyError(err, { context: "Send phone OTP", fallback: "Couldn't send a code to that number. Please try again." }));
      } finally {
        setSending(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send-once on mount
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyPhoneOtp({ phoneNumber: phone, otp: otp.join("") });
      onVerified(result.confirmToken);
    } catch (err) {
      setError(notifyError(err, { context: "Verify phone OTP", fallback: "Invalid or expired code. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      await requestPhoneOtp({ phoneNumber: phone });
      setResendMessage("A new code has been sent.");
      setResendCount((c) => c + 1);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch (err) {
      setResendMessage(notifyError(err, { context: "Resend phone OTP", fallback: "Could not resend. Please try again.", silent: true }));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col">
      <div className="mb-7">
        <h1 className="text-headline text-gray-900 mb-3 font-sans">
          Verification Code Sent
        </h1>
        <p className="text-sm text-gray-500 mb-0.5">
          Enter the 6-digit code that was sent to
        </p>
        <p className="text-sm font-semibold text-gray-900">{phone}</p>
        <button onClick={onBack} className="text-sm font-medium mt-1 hover:underline text-[#1B2FE8]">
          Wrong number?
        </button>
        <p className={`text-xs mt-2 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
          {sending
            ? "Sending code…"
            : codeExpired
              ? "Your code has expired — request a new one below."
              : `Code expires in ${formatCountdown(secondsLeft)}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <OtpBoxes
          key={resendCount}
          value={otp}
          onChange={(next) => { setOtp(next); setError(""); }}
          length={6}
          disabled={sending}
          autoFocus
          renderBoxes={(digits, activeIndex) => (
            <div className="flex items-center gap-2 justify-center pointer-events-none">
              {digits.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className={`w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all border-[1.5px] ${d || i === activeIndex ? "border-primary" : "border-[#C2C2C2]"}`}
                >
                  {d}
                </div>
              ))}
              <span className="text-gray-400 text-lg font-medium px-1">—</span>
              {digits.slice(3, 6).map((d, i) => {
                const idx = i + 3;
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all border-[1.5px] ${d || idx === activeIndex ? "border-primary" : "border-[#C2C2C2]"}`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          )}
        />

        {error && <p className="text-sm text-red-500 text-center -mt-2">{error}</p>}

        <Button
          type="submit"
          disabled={sending || codeExpired || otp.some((d) => !d)}
          loading={loading}
        >
          {loading ? "Verifying..." : "Continue"}
        </Button>
      </form>

      <p className="text-center text-sm mt-5 text-gray-text">
        Didn't get OTP?{" "}
        <button onClick={handleResend} disabled={resending || sending} className="font-semibold hover:underline disabled:opacity-60 text-[#1B2FE8]">
          {resending ? "Resending..." : "Resend"}
        </button>
      </p>
      {resendMessage && <p className="text-center text-xs text-gray-400 mt-1">{resendMessage}</p>}
    </div>
  );
}
