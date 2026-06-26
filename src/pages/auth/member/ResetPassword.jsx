import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../../assets/cta/ctalogo.png";
import authHeroBg from "../../../assets/auth/mobile-auth.png";

// ---------------------------------------------------------------------------
// Primitives (same light-sheet style as SignIn)
// ---------------------------------------------------------------------------
function TextInput({
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled,
  rightElement,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white disabled:opacity-50"
        style={{ border: focused ? "1.5px solid #1C2B8A" : "1.5px solid #E0E0E6" }}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-full py-4 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
      style={{ background: disabled || loading ? "#B0B8D8" : "#1C2B8A" }}
    >
      {loading ? "Resetting..." : children}
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
// Reset password form
// ---------------------------------------------------------------------------
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
      await resetPassword({
        email,
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      navigate("/member/app-sign-in", { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Reset password" }));
    } finally {
      setLoading(false);
    }
  }

  const isReady = form.newPassword && form.confirmPassword;

  return (
    <MobileShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500">
            Choose a new password for your account.
          </p>
        </div>

        {!email || !token ? (
          <p className="text-sm" style={{ color: "#E53E3E" }}>
            This reset link is invalid or has expired.{" "}
            <Link
              to="/member/forgot-password"
              className="font-semibold"
              style={{ color: "#1C2B8A" }}
            >
              Request a new one
            </Link>
          </p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#111" }}>
                New Password
              </label>
              <TextInput
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#111" }}>
                Confirm Password
              </label>
              <TextInput
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
              Reset Password
            </PrimaryButton>
          </>
        )}

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
    </MobileShell>
  );
}
