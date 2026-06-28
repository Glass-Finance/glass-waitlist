import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { getMyInvites } from "../../api/invites";
import { isMobileDevice, mobileRequiredPath } from "../../utils/deviceRedirect";
import { notifyError } from "../../utils/errorHandler";
import { toastInfo } from "../../utils/toast";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";

// One sign-in page reachable from two routes (/sign-in and
// /member/app-sign-in) — neither the page nor the login call itself knows
// in advance whether this is a community owner or a mobile-only member,
// only the *resulting* role/device does, so there was never a reason for
// two separate implementations. AuthLayout already adapts its chrome
// between a desktop split-screen and a mobile top-banner/bottom-sheet via
// CSS breakpoints, which is exactly the "one page, adapts by screen size"
// behavior both entry points need.
export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // client.js's 401 interceptor hard-redirects here on session expiry — a
  // toast shown right before that navigation gets wiped along with
  // everything else, so it leaves this flag for the destination to read.
  useEffect(() => {
    if (sessionStorage.getItem("glass_session_expired")) {
      sessionStorage.removeItem("glass_session_expired");
      setTimeout(() => {
        toastInfo("Session expired", { description: "For your security, please sign in again." });
      }, 0);
    }
  }, []);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  // Shared by password sign-in and Google sign-in: resolves the destination
  // by the *resulting* role/device, since neither knows in advance whether
  // this is a community owner or a mobile-only member. Returns the path
  // rather than navigating directly so Google sign-in can detour through
  // complete-profile first when Google never gave us a name, stashing this
  // as where to continue afterward.
  async function resolveDestination(user) {
    if (user?.isAdmin) return "/dashboard/home";

    // The member app is mobile-only — a non-admin signing in from a
    // desktop/tablet gets the QR handoff instead of a layout that was
    // never built for that viewport.
    if (!isMobileDevice()) return mobileRequiredPath("/member/app-sign-in");

    const inviteRes = await getMyInvites();
    const invites = inviteRes?.data?.data || [];
    return invites.length > 0 ? "/member/invites" : "/member/home";
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
      navigate(await resolveDestination(user), { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Sign in", fallback: "Incorrect email or password." }));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth(user, { profileComplete } = {}) {
    try {
      const next = await resolveDestination(user);
      if (!profileComplete) {
        // /complete-profile is ungated, /member/complete-profile is
        // mobile-gated (matching /member/join) — pick by where the
        // resolved destination was actually headed.
        const completeProfilePath = next.startsWith("/dashboard")
          ? "/complete-profile"
          : "/member/complete-profile";
        navigate(completeProfilePath, { state: { next } });
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Google sign in" }));
    }
  }

  const isReady = form.email.trim() && form.password;

  return (
    <AuthLayout heroTitle="Community Finance" heroSubtitle="Crystal Clear">
      <div className="w-full max-w-sm flex flex-col my-auto gap-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Sign in To Your Account</h1>
          <p className="text-sm text-gray-500">Enter your credentials to continue.</p>
        </div>

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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium" style={{ color: "#1C2B8A" }}>
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

        <PrimaryButton onClick={handleSignIn} loading={loading} disabled={!isReady}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Signing in…</span>
            </span>
          ) : (
            "Sign In"
          )}
        </PrimaryButton>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleAuthButton onAuthenticated={handleGoogleAuth} label="signin_with" />

        <p className="text-sm text-center text-gray-500 pb-2">
          New User?{" "}
          <Link to="/sign-up" className="font-semibold" style={{ color: "#1C2B8A" }}>
           Create Account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
