import { useState } from "react";
import { verifyEmail, resendVerification } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";
import { useCountdown, formatCountdown } from "../../../hooks/useCountdown";
import OtpBoxes from "../../../components/common/OtpBoxes";

// Codes are valid for 15 minutes (see the same figure quoted to users in
// SignIn.jsx and member/Join.jsx).
const OTP_VALIDITY_SECONDS = 15 * 60;

// ── Step 2: OTP Verification ───────────────────────────────────────────────────
export default function OTPStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCount, setResendCount] = useState(0);

  const secondsLeft = useCountdown(
    OTP_VALIDITY_SECONDS,
    `${email}-${resendCount}`,
  );
  const codeExpired = secondsLeft <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyEmail({ email, token: otp.join("") });
      onVerified(result);
    } catch (err) {
      setError(
        notifyError(err, {
          context: "Verify OTP",
          fallback: "Invalid or expired code. Please try again.",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      await resendVerification({ email });
      setResendMessage("A new code has been sent.");
      setResendCount((c) => c + 1);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch (err) {
      setResendMessage(
        notifyError(err, {
          context: "Resend OTP",
          fallback: "Could not resend. Please try again.",
          silent: true,
        }),
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="mb-7">
        <h1
          className="text-headline text-gray-900 mb-3"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Verification Code Sent
        </h1>
        <p className="text-sm text-gray-500 mb-0.5">
          Enter the 6-digit code that was sent to
        </p>
        <p className="text-sm font-semibold text-gray-900">{email}</p>
        <button
          onClick={onBack}
          className="text-sm font-medium mt-1 hover:underline"
          style={{ color: "#1B2FE8" }}
        >
          Wrong email?
        </button>
        <p
          className={`text-xs mt-2 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}
        >
          {codeExpired
            ? "Your code has expired — request a new one below."
            : `Code expires in ${formatCountdown(secondsLeft)}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <OtpBoxes
          value={otp}
          onChange={(next) => { setOtp(next); setError(""); }}
          length={6}
          autoFocus
          renderBoxes={(digits, activeIndex) => (
            <div className="flex items-center gap-2 justify-center pointer-events-none">
              {digits.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className="w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all"
                  style={{ border: `1.5px solid ${d || i === activeIndex ? "var(--color-primary)" : "#C2C2C2"}` }}
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
                    className="w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all"
                    style={{ border: `1.5px solid ${d || idx === activeIndex ? "var(--color-primary)" : "#C2C2C2"}` }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          )}
        />

        {error && (
          <p className="text-sm text-red-500 text-center -mt-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || codeExpired || otp.some((d) => !d)}
          className="w-full py-3.5 rounded-3xl text-white font-semibold text-button transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{ background: "#2535c3" }}
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>

      <p
        className="text-center text-sm mt-5"
        style={{ color: "var(--color-gray-text)" }}
      >
        Didn't get OTP?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-semibold hover:underline disabled:opacity-60"
          style={{ color: "#1B2FE8" }}
        >
          {resending ? "Resending..." : "Resend"}
        </button>
      </p>
      {resendMessage && (
        <p className="text-center text-xs text-gray-400 mt-1">
          {resendMessage}
        </p>
      )}
    </div>
  );
}
