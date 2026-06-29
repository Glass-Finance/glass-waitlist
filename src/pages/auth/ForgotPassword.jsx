import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
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
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Reset Password</h1>
          <p className="text-sm text-gray-500">Enter your email and we'll send you a link to reset it.</p>
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
              setSent(false);
            }}
            autoComplete="email"
            inputMode="email"
            disabled={loading}
          />
          {sent ? (
            <p className="flex items-center gap-1.5 text-xs mt-1.5 px-1" style={{ color: "#059669" }}>
              <CheckCircle2 size={14} />
              Password Reset Email Has Been Sent
            </p>
          ) : (
            <ErrorMessage message={error} />
          )}
        </div>

        <PrimaryButton onClick={handleSubmit} loading={loading} disabled={!email.trim()}>
          {loading ? "Sending..." : "Send Reset Password"}
        </PrimaryButton>

        <p className="text-sm text-center text-gray-500 pb-2">
          Remember your password?{" "}
          <Link to="/sign-in" className="font-semibold" style={{ color: "#1C2B8A" }}>
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
