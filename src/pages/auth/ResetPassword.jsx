import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../services/authService";
import { notifyError } from "../../utils/errorHandler";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";

// Shared by /reset-password and /member/reset-password — see SignIn.jsx
// for why these were merged.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  async function handleSubmit() {
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword({ email, token, newPassword: form.newPassword, confirmPassword: form.confirmPassword });
      navigate("/sign-in", { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Reset password" }));
    } finally {
      setLoading(false);
    }
  }

  const isReady = form.newPassword && form.confirmPassword;

  return (
    <AuthLayout heroTitle="Community Finance" heroSubtitle="Crystal Clear">
      <div className="w-full max-w-sm flex flex-col my-auto gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Reset Password</h1>
          <p className="text-sm text-gray-500">Choose a new password for your account.</p>
        </div>

        {!email || !token ? (
          <p className="text-sm" style={{ color: "#E53E3E" }}>
            This reset link is invalid or has expired.{" "}
            <Link to="/forgot-password" className="font-semibold" style={{ color: "#1C2B8A" }}>
              Request a new one
            </Link>
          </p>
        ) : (
          <>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <TextInput
                id="newPassword"
                type={showPw ? "text" : "password"}
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={set("newPassword")}
                autoComplete="new-password"
                disabled={loading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <TextInput
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                autoComplete="new-password"
                disabled={loading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <ErrorMessage message={error} />
            </div>

            <PrimaryButton onClick={handleSubmit} loading={loading} disabled={!isReady}>
              {loading ? "Resetting..." : "Reset Password"}
            </PrimaryButton>
          </>
        )}

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
