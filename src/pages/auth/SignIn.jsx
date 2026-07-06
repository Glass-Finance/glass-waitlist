import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { verifyMfaLogin } from "../../services/authService";
import { getMyInvites, getMyCommunityJoinRequests } from "../../api/invites";
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
  usePageTitle("Sign in");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setSession } = useAuth();
  const isMemberSignIn = location.pathname === "/member/app-sign-in";
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // MFA challenge state — set after login() returns mfaRequired: true
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaChallengeToken }
  const [mfaCode, setMfaCode] = useState("");
  const mfaInputRef = useRef(null);

  // Show a banner if the user was mid-verification (registered but not yet
  // confirmed email) and then refreshed or navigated away.
  const [pendingVerificationEmail] = useState(() => {
    try {
      const raw = sessionStorage.getItem("glass_pending_member_verification");
      return raw ? JSON.parse(raw).email : null;
    } catch { return null; }
  });

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
  // this is a community owner or a mobile-only member.
  async function resolveDestination(user) {
    if (user?.email?.toLowerCase() === "glasspayhq@gmail.com") return "/dashboard/admin-panel";
    if (user?.isAdmin) return "/dashboard/home";

    // The member app is mobile-only — a non-admin signing in from a
    // desktop/tablet gets the QR handoff instead of a layout that was
    // never built for that viewport.
    if (!isMobileDevice()) return mobileRequiredPath("/member/app-sign-in");

    // Honor a ?return= param set by /invite landing page (or any deep link).
    // Only trust paths that start with /member/ to prevent open redirect.
    const returnTo = new URLSearchParams(location.search).get("return");
    if (returnTo && returnTo.startsWith("/member/")) return returnTo;

    // If the session expired mid-payment (while the user was on Paystack's
    // page), PaymentSummary stored the reference before navigating away.
    // Re-login should land them on the callback to finish verifying.
    const pendingRef = sessionStorage.getItem("paymentPendingRef");
    if (pendingRef) {
      sessionStorage.removeItem("paymentPendingRef");
      return `/payment/callback?reference=${pendingRef}`;
    }

    const inviteRes = await getMyInvites();
    const inviteData = inviteRes?.data?.data;
    const invites = Array.isArray(inviteData) ? inviteData : (inviteData?.content ?? []);

    // Untested against the live backend yet, unlike getMyInvites above —
    // don't let a wrong/broken endpoint here block sign-in entirely.
    let joinRequests = [];
    try {
      const joinReqRes = await getMyCommunityJoinRequests();
      const data = joinReqRes?.data?.data;
      joinRequests = Array.isArray(data) ? data : (data?.content ?? []);
    } catch {
      // fall through with joinRequests = []
    }

    return invites.length > 0 || joinRequests.length > 0 ? "/member/invites" : "/member/home";
  }

  async function handleSignIn() {
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await login(form.email.trim().toLowerCase(), form.password);
      if (result?.mfaRequired) {
        setMfaChallenge({ mfaChallengeToken: result.mfaChallengeToken });
        setTimeout(() => mfaInputRef.current?.focus(), 50);
        return;
      }
      navigate(await resolveDestination(result), { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Sign in", fallback: "Incorrect email or password." }));
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaVerify() {
    if (mfaCode.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const authData = await verifyMfaLogin({
        challengeToken: mfaChallenge.mfaChallengeToken,
        code: mfaCode,
      });
      const user = await setSession(authData);
      navigate(await resolveDestination(user), { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "MFA verification", fallback: "Invalid code. Please try again." }));
      setMfaCode("");
      mfaInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth(user) {
    try {
      navigate(await resolveDestination(user), { replace: true });
    } catch (err) {
      setError(notifyError(err, { context: "Google sign in" }));
    }
  }

  const isReady = form.email.trim() && form.password;

  // ── MFA challenge screen ──────────────────────────────────────────────────────
  if (mfaChallenge) {
    return (
      <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
        <div className="w-full max-w-sm flex flex-col my-auto gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <ShieldCheck size={22} style={{ color: "#002FA7" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Enter MFA Code</h1>
              <p className="text-sm text-gray-500">Open your authenticator app and enter the 6-digit code.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="mfa-code">Authentication Code</Label>
            <TextInput
              id="mfa-code"
              ref={mfaInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleMfaVerify()}
              autoComplete="one-time-code"
              disabled={loading}
            />
            <ErrorMessage message={error} />
          </div>

          <PrimaryButton onClick={handleMfaVerify} loading={loading} disabled={mfaCode.length !== 6}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying…</span>
              </span>
            ) : "Verify Code"}
          </PrimaryButton>

          <button
            onClick={() => { setMfaChallenge(null); setMfaCode(""); setError(""); }}
            className="text-sm text-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
          >
            ← Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
      <div className="w-full max-w-sm flex flex-col my-auto gap-6">
        {pendingVerificationEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">Email verification pending</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              You registered with <span className="font-medium">{pendingVerificationEmail}</span> but didn't finish verifying.
              Check your inbox — and spam folder — for the 6-digit code.
            </p>
            <p className="text-xs text-amber-700 leading-relaxed mt-1">
              Codes expire after 15 minutes. If yours has expired, go back and register again to receive a fresh one.
            </p>
            <Link
              to="/member/join"
              className="text-xs font-semibold mt-2 inline-block"
              style={{ color: "#92400e" }}
            >
              Back to registration →
            </Link>
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in To Your Account</h1>
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

        {isMemberSignIn ? (
          <p className="text-sm text-center text-gray-500 pb-2">
            New to Glass?{" "}
            <span className="font-semibold" style={{ color: "#1C2B8A" }}>
              Use the invite link your admin shared with you.
            </span>
          </p>
        ) : (
          <p className="text-sm text-center text-gray-500 pb-2">
            New User?{" "}
            <Link to="/sign-up" className="font-semibold" style={{ color: "#1C2B8A" }}>
              Create Account
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
