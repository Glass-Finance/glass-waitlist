import { useState, useRef } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { notifyError } from "../../utils/errorHandler";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";

export default function ForgotPassword() {
  usePageTitle("Reset your password");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

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
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(notifyError(err, { context: "Forgot password" }));
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    setError("");
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      setTimeout(() => inputRefs.current[5]?.focus(), 0);
    }
    e.preventDefault();
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
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
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
              <Link to="/sign-in" className="font-semibold" style={{ color: "#1C2B8A" }}>
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
            </div>

            <div>
              <Label>Verification Code</Label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      handleOtpKeyDown(i, e);
                      if (e.key === "Enter" && otpComplete) handleVerify();
                    }}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => (e.target.style.borderColor = "#1C2B8A")}
                    onBlur={(e) => (e.target.style.borderColor = digit ? "#1C2B8A" : "#e5e7eb")}
                    style={{
                      flex: 1,
                      height: 52,
                      minWidth: 0,
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 700,
                      borderRadius: 12,
                      border: `2px solid ${digit ? "#1C2B8A" : "#e5e7eb"}`,
                      outline: "none",
                      background: "#fff",
                      color: "#111827",
                      transition: "border-color .15s",
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                ))}
              </div>
              <ErrorMessage message={error} />
            </div>

            <PrimaryButton onClick={handleVerify} disabled={!otpComplete || loading}>
              Verify Code
            </PrimaryButton>

            <div className="flex flex-col items-center gap-1 text-sm text-gray-500 pb-2">
              <p>
                Didn't receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold bg-transparent border-none cursor-pointer disabled:opacity-50"
                  style={{ color: "#1C2B8A" }}
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
