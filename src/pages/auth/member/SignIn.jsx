import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../../store/AuthContext";
import { getMyInvites } from "../../../api/invites";
import { isMobileDevice, mobileRequiredPath } from "../../../utils/deviceRedirect";
import { notifyError } from "../../../utils/errorHandler";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../../assets/cta/ctalogo.png";
import authHeroBg from "../../../assets/auth/mobile-auth.png";

// ---------------------------------------------------------------------------
// Primitives (same light-sheet style as SignUp)
// ---------------------------------------------------------------------------
function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium mb-1.5"
      style={{ color: "#111" }}
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  disabled,
  rightElement,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white disabled:opacity-50"
        style={{
          border: focused ? "1.5px solid #1C2B8A" : "1.5px solid #E0E0E6",
        }}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
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
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Signing in…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p
      className="text-xs mt-1.5 px-1"
      style={{ color: "#E53E3E" }}
      role="alert"
    >
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Shell — same two-tone layout as SignUp
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
            Welcome Back to Glass
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
// Sign In form
// ---------------------------------------------------------------------------
export default function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  // Shared by password sign-in and Google sign-in: routes by the
  // *resulting* role/device, since neither knows in advance whether this
  // is a community owner or a mobile-only member.
  async function routeAfterAuth(user) {
    if (user?.isAdmin) {
      navigate("/dashboard/home", { replace: true });
      return;
    }

    // The member app is mobile-only — a non-admin signing in from a
    // desktop/tablet gets the QR handoff instead of a layout that was
    // never built for that viewport.
    if (!isMobileDevice()) {
      navigate(mobileRequiredPath("/member/app-sign-in"), { replace: true });
      return;
    }

    const inviteRes = await getMyInvites();
    const invites = inviteRes?.data?.data || [];

    if (invites.length > 0) {
      navigate("/member/invites", { replace: true });
    } else {
      navigate("/member/home", { replace: true });
    }
  }

  async function handleSignIn() {
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      await routeAfterAuth(user);
    } catch (err) {
      setError(notifyError(err, { context: "Sign in", fallback: "Incorrect email or password." }));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth(user) {
    try {
      await routeAfterAuth(user);
    } catch (err) {
      setError(notifyError(err, { context: "Google sign in" }));
    }
  }

  const isReady = form.email.trim() && form.password;

  return (
    <MobileShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            Login to Your Account
          </h1>
          <p className="text-sm text-gray-500">
            Enter your credentials to continue.
          </p>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email Address</Label>
          <TextInput
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
            inputMode="email"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/member/forgot-password"
              className="text-xs font-medium"
              style={{ color: "#1C2B8A" }}
            >
              Forgot password?
            </Link>
          </div>
          <TextInput
            id="password"
            type={showPw ? "text" : "password"}
            placeholder="Enter your password"
            value={form.password}
            onChange={set("password")}
            autoComplete="current-password"
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
          <ErrorMessage message={error} />
        </div>

        <PrimaryButton
          onClick={handleSignIn}
          loading={loading}
          disabled={!isReady}
        >
          Sign In
        </PrimaryButton>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleAuthButton onAuthenticated={handleGoogleAuth} label="signin_with" />

        <p className="text-sm text-center text-gray-500 pb-2">
          Don't have an account?{" "}
          <Link
            to="/member/join"
            className="font-semibold"
            style={{ color: "#1C2B8A" }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </MobileShell>
  );
}
