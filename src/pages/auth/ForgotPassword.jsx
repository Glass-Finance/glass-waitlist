import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { notifyError } from "../../utils/errorHandler";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";

// Shared by /forgot-password and /member/forgot-password — see SignIn.jsx
// for why these were merged.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(notifyError(err, { context: "Forgot password" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout heroTitle="Community Finance" heroSubtitle="Crystal Clear">
      <div className="w-full max-w-sm flex flex-col my-auto gap-6">
        {sent ? (
          <>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Check Your Email</h1>
              <p className="text-sm text-gray-500">
                We've sent a password reset link to{" "}
                <span className="font-semibold text-gray-900">{email}</span>.
              </p>
            </div>
            <Link to="/sign-in" className="text-sm font-semibold text-center" style={{ color: "#1C2B8A" }}>
              Back to Sign In
            </Link>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Forgot Password?</h1>
              <p className="text-sm text-gray-500">
                Enter your email and we'll send you a link to reset it.
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <TextInput
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />
              <ErrorMessage message={error} />
            </div>

            <PrimaryButton onClick={handleSubmit} loading={loading} disabled={!email.trim()}>
              {loading ? "Sending..." : "Send Reset Link"}
            </PrimaryButton>

            <p className="text-sm text-center text-gray-500 pb-2">
              Remember your password?{" "}
              <Link to="/sign-in" className="font-semibold" style={{ color: "#1C2B8A" }}>
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
