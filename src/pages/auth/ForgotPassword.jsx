import { useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { notifyError } from "../../utils/errorHandler";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";
import OtpBoxes from "../../components/common/OtpBoxes";

// Codes are valid for 15 minutes (see the same figure quoted to users in
// SignIn.jsx and member/Join.jsx).
const OTP_VALIDITY_SECONDS = 15 * 60;

export default function ForgotPassword() {
  usePageTitle("Reset your password");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCount, setResendCount] = useState(0);

  const secondsLeft = useCountdown(OTP_VALIDITY_SECONDS, `${email}-${resendCount}`);
  const codeExpired = step === "otp" && secondsLeft <= 0;

  async function handleSendEmail() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setStep("otp");
    } catch (err) {
      setError(notifyError(err, { context: "Forgot password" }));
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(next) {
    setOtp(next);
    setError("");
  }

  function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    navigate(
      `/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}&token=${encodeURIComponent(code)}`
    );
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setOtp(["", "", "", "", "", ""]);
      // Also remounts OtpBoxes (keyed on resendCount below), so autoFocus
      // re-fires and refocuses the field for the freshly-sent code.
      setResendCount((c) => c + 1);
    } catch (err) {
      setError(notifyError(err, { context: "Resend code" }));
    } finally {
      setLoading(false);
    }
  }

  const otpComplete = otp.every((d) => d !== "");

  return (
    <AuthLayout heroTitle="Manage Community" heroSubtitle="Finance Effortlessly">
      <div className="w-full max-w-sm flex flex-col gap-6 md:my-auto">
        {step === "email" ? (
          <>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Reset Password</h1>
              <p className="text-sm text-gray-500">
                Enter your email and we'll send you a code to reset it.
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <TextInput
                id="email"
                type="email"
                placeholder="e.g Bax**re@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />
              <ErrorMessage message={error} />
            </div>

            <PrimaryButton onClick={handleSendEmail} loading={loading} disabled={!email.trim()}>
              {loading ? "Sending…" : "Send Reset Code"}
            </PrimaryButton>

            <p className="text-sm text-center text-gray-500 pb-2">
              Remember your password?{" "}
              <Link to="/sign-in" className="font-semibold text-[#1C2B8A]">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Enter Reset Code</h1>
              <p className="text-sm text-gray-500">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-gray-800">{email}</span>.
              </p>
              <p className={`text-xs mt-1 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {codeExpired
                  ? "Your code has expired — request a new one below."
                  : `Code expires in ${formatCountdown(secondsLeft)}`}
              </p>
            </div>

            {/* Wrapping in a real <form> matches WebKit's own documented
                pattern for autocomplete="one-time-code" and gets the
                iOS keyboard's Return/Go key to submit for free. */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (otpComplete) handleVerify();
              }}
            >
            <div>
              <Label>Verification Code</Label>
              <div style={{ marginTop: 6 }}>
                <OtpBoxes
                  key={resendCount}
                  value={otp}
                  onChange={handleOtpChange}
                  length={6}
                  autoFocus
                  renderBoxes={(digits, activeIndex) => (
                    <div style={{ display: "flex", gap: 8 }} className="pointer-events-none">
                      {digits.map((d, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 52,
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            fontWeight: 700,
                            borderRadius: 12,
                            border: `2px solid ${d || i === activeIndex ? "#1C2B8A" : "var(--color-surface-container-border)"}`,
                            background: "#fff",
                            color: "#111827",
                            transition: "border-color .15s",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
              <ErrorMessage message={error} />
            </div>

            <PrimaryButton onClick={handleVerify} disabled={!otpComplete || loading || codeExpired}>
              Verify Code
            </PrimaryButton>
            </form>

            {/* Deliberately outside the <form>: a bare <button> with no
                explicit type defaults to type="submit" inside a form, which
                would have triggered the form's onSubmit (and double-fired
                handleVerify) on click. */}
            <div className="flex flex-col items-center gap-1 text-sm text-gray-500 pb-2">
              <p>
                Didn't receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold bg-transparent border-none cursor-pointer disabled:opacity-50 text-[#1C2B8A]"
                >
                  {loading ? "Sending…" : "Resend code"}
                </button>
              </p>
              <button
                onClick={() => {
                  setStep("email");
                  setError("");
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="text-xs bg-transparent border-none cursor-pointer mt-1"
                style={{ color: "#6b7280" }}
              >
                ← Change email address
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
