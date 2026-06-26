import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../../assets/cta/ctalogo.png";
import authHeroBg from "../../../assets/auth/mobile-auth.png";

// ---------------------------------------------------------------------------
// Primitives (same light-sheet style as SignIn)
// ---------------------------------------------------------------------------
function PrimaryButton({ children, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-full py-4 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
      style={{ background: disabled || loading ? "#B0B8D8" : "#1C2B8A" }}
    >
      {loading ? "Sending..." : children}
    </button>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1.5 px-1" style={{ color: "#E53E3E" }} role="alert">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Shell — same two-tone layout as SignIn
// ---------------------------------------------------------------------------
function MobileShell({ children }) {
  return (
    <div className="flex justify-center items-start min-h-screen bg-[#EFEFEF]">
      <div
        className="relative w-full max-w-[430px] min-h-screen overflow-hidden flex flex-col"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Top image */}
        <div
          className="relative flex-shrink-0"
          style={{ height: "45vh", minHeight: 220, borderRadius: 0 }}
        >
          <img
            src={authHeroBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(28,43,138,0.55) 0%, rgba(90,10,90,0.45) 100%)",
            }}
          />
          <img
            src={glassLogo}
            alt="Glass"
            className="absolute top-10 left-5 h-9 w-auto object-contain"
            draggable={false}
          />
          <p
            className="absolute bottom-10 left-0 right-0 text-center text-white font-medium leading-snug px-8 pb-10"
            style={{ fontSize: "clamp(24px,4vw,22px)" }}
          >
            Reset Your Password
          </p>
        </div>

        {/* Bottom sheet */}
        <div
          className="flex-1 flex flex-col px-6 pt-8 pb-safe z-30"
          style={{
            background: "#EFEFEF",
            borderRadius: "24px 24px 0 0",
            marginTop: -28,
            overflowY: "auto",
          }}
        >
          {children}
          <div style={{ height: "env(safe-area-inset-bottom, 20px)" }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forgot password form
// ---------------------------------------------------------------------------
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
    <MobileShell>
      {sent ? (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              Check Your Email
            </h1>
            <p className="text-sm text-gray-500">
              We've sent a password reset link to{" "}
              <span className="font-semibold text-gray-900">{email}</span>.
            </p>
          </div>
          <Link
            to="/member/app-sign-in"
            className="text-sm font-semibold text-center"
            style={{ color: "#1C2B8A" }}
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              Forgot Password?
            </h1>
            <p className="text-sm text-gray-500">
              Enter your email and we'll send you a link to reset it.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#111" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white disabled:opacity-50"
              style={{ border: "1.5px solid #E0E0E6" }}
            />
            <ErrorMessage message={error} />
          </div>

          <PrimaryButton onClick={handleSubmit} loading={loading} disabled={!email.trim()}>
            Send Reset Link
          </PrimaryButton>

          <p className="text-sm text-center text-gray-500 pb-2">
            Remember your password?{" "}
            <Link
              to="/member/app-sign-in"
              className="font-semibold"
              style={{ color: "#1C2B8A" }}
            >
              Sign In
            </Link>
          </p>
        </div>
      )}
    </MobileShell>
  );
}
