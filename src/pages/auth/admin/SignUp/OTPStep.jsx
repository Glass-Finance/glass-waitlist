import { useState, useRef } from "react";
import { verifyEmail, resendVerification } from "../../../../services/authService";
import { notifyError } from "../../../../utils/errorHandler";

// ── Step 2: OTP Verification ───────────────────────────────────────────────────
export default function OTPStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyEmail({ email, token: otp.join("") });
      onVerified(result);
    } catch (err) {
      setError(notifyError(err, { context: "Verify OTP", fallback: "Invalid or expired code. Please try again." }));
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
    } catch (err) {
      setResendMessage(notifyError(err, { context: "Resend OTP", fallback: "Could not resend. Please try again.", silent: true }));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="mb-7">
        <h1
          className="text-2xl font-bold text-gray-900 mb-3"
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
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex items-center gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all"
              style={{ border: "1.5px solid #C2C2C2" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")}
            />
          ))}
          <span className="text-gray-400 text-lg font-medium px-1">—</span>
          {[3, 4, 5].map((i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all"
              style={{ border: "1.5px solid #C2C2C2" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center -mt-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || otp.some((d) => !d)}
          className="w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
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
