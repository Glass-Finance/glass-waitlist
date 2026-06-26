import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";
import AuthLayout from "../../../layouts/AuthLayout";

// ── Shared styles (matches SignIn/SignUp) ─────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
const inputStyle = { border: "1.5px solid #C2C2C2" };
const onFocus = (e) => (e.target.style.borderColor = "#2535c3");
const onBlur = (e) => (e.target.style.borderColor = "#C2C2C2");

const PrimaryBtn = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    style={{ background: "#2535c3" }}
  >
    {children}
  </button>
);

// ── Desktop reset-password form ───────────────────────────────────────────────
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email,
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      navigate("/sign-in", { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Reset password" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      <div className="w-full max-w-sm flex flex-col my-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500">
            Choose a new password for your account.
          </p>
        </div>

        {!email || !token ? (
          <p className="text-sm text-red-500 text-center">
            This reset link is invalid or has expired.{" "}
            <Link
              to="/forgot-password"
              className="font-semibold hover:underline"
              style={{ color: "#1B2FE8" }}
            >
              Request a new one
            </Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className={`${inputCls} pr-11`}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  required
                  className={`${inputCls} pr-11`}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

            <PrimaryBtn loading={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </PrimaryBtn>
          </form>
        )}

        <p className="text-center text-sm mt-5 text-gray-500">
          Remember your password?{" "}
          <Link
            to="/sign-in"
            className="font-semibold hover:underline"
            style={{ color: "#1B2FE8" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
