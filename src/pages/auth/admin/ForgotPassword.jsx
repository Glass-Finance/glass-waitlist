import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../services/authService";
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

// ── Desktop forgot-password form ──────────────────────────────────────────────
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      if (typeof pendo !== "undefined") {
        pendo.track("password_reset_requested", {
          user_type: "admin",
        });
      }
      setSent(true);
    } catch (err) {
      setError(notifyError(err, { context: "Forgot password" }));
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
        {sent ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
                Check Your Email
              </h1>
              <p className="text-sm text-gray-500">
                We've sent a password reset link to{" "}
                <span className="font-semibold text-gray-900">{email}</span>.
              </p>
            </div>
            <Link
              to="/sign-in"
              className="text-center text-sm font-semibold hover:underline"
              style={{ color: "#1B2FE8" }}
            >
              Back to Sign In
            </Link>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
                Forgot Password?
              </h1>
              <p className="text-sm text-gray-500">
                Enter your email and we'll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g Bax**re@gmail.com"
                  required
                  className={inputCls}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

              <PrimaryBtn loading={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </PrimaryBtn>
            </form>

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
          </>
        )}
      </div>
    </AuthLayout>
  );
}
