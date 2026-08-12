import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { verifyMfaLogin, requestLoginOtp, verifyLoginOtp } from "../../services/authService";
import { getMyInvites, getMyCommunityJoinRequests, submitJoinRequest } from "../../api/invites";
import { isMobileDevice, mobileRequiredPath } from "../../utils/deviceRedirect";
import { notifyError, getErrorMessage, getRetryAfterSeconds } from "../../utils/errorHandler";
import { getEmailError } from "../../utils/validators";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../utils/phone";
import { toastInfo, toastSuccess } from "../../utils/toast";
import { JOIN_COMMUNITY_KEY } from "../../hooks/useJoinCommunityParam";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";
import OtpBoxes from "../../components/common/OtpBoxes";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";

// A single field doubles as email-or-phone -- the backend rejects both/
// neither, so there's exactly one identifier to resolve, not two fields to
// reconcile. "@" is the one unambiguous signal between the two formats.
function parseIdentifier(value) {
  const trimmed = value.trim();
  return trimmed.includes("@")
    ? { email: trimmed.toLowerCase() }
    : { phoneNumber: trimmed };
}

function validateIdentifier(value) {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email or phone number.";
  return trimmed.includes("@") ? getEmailError(trimmed) : (isPhoneValid(trimmed) ? "" : PHONE_FORMAT_HINT);
}

// Tab switcher between password and passwordless sign-in -- both are
// first-class here (the backend built OTP login as a parallel flow, not a
// "forgot your password" fallback), so equal-weight tabs rather than a
// single primary form with a secondary link underneath.
function ModeTabs({ mode, setMode, disabled }) {
  return (
    <div className="flex gap-1 bg-stacked-container rounded-xl p-1">
      <button
        type="button"
        onClick={() => setMode("password")}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all disabled:cursor-not-allowed ${
          mode === "password" ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        <Lock size={14} /> Password
      </button>
      <button
        type="button"
        onClick={() => setMode("otp")}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all disabled:cursor-not-allowed ${
          mode === "otp" ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        <KeyRound size={14} /> One-Time Code
      </button>
    </div>
  );
}

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
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ identifier: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // MFA challenge state — set after login() returns mfaRequired: true
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaChallengeToken }
  const [mfaCode, setMfaCode] = useState("");
  const mfaInputRef = useRef(null);

  // ── Passwordless (OTP) sign-in ────────────────────────────────────────────
  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [otpStep, setOtpStep] = useState("request"); // "request" | "verify"
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpIdentifierError, setOtpIdentifierError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // Seconds-left for the code itself, driven by the server's expiresAt (not
  // a hardcoded TTL) -- resendCount as the reset key restarts it on resend.
  const [otpInitialSeconds, setOtpInitialSeconds] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  // Separate cooldown for the resend button itself, driven by a 429's
  // Retry-After when one comes back -- 0 whenever there's no active cooldown.
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCooldownKey, setResendCooldownKey] = useState(0);
  const otpSecondsLeft = useCountdown(otpInitialSeconds, resendCount);
  const resendSecondsLeft = useCountdown(resendCooldown, resendCooldownKey);
  const otpCodeExpired = otpStep === "verify" && otpSecondsLeft <= 0;

  function switchMode(next) {
    setMode(next);
    setOtpStep("request");
    setOtpError("");
    setError("");
  }

  // Show a banner if the user was mid-verification (registered but not yet
  // confirmed email) and then refreshed or navigated away.
  const [pendingVerificationEmail] = useState(() => {
    try {
      const raw = sessionStorage.getItem("glass_pending_member_verification");
      return raw ? JSON.parse(raw).email : null;
    } catch { return null; }
  });

  // "New to Glass?" below is wrong for anyone who obviously already has an
  // account — read once up front (before the session-expiry effect below
  // clears its flag) so both known "definitely returning" paths suppress
  // it: SideDrawer's logout (router state) and client.js's session-expiry
  // hard-redirect (sessionStorage flag, since that's a full page reload).
  const [isReturningVisitor] = useState(() => {
    if (location.state?.justLoggedOut) return true;
    try {
      return sessionStorage.getItem("glass_session_expired") === "1";
    } catch {
      return false;
    }
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

  function validateField(field, value) {
    if (field === "identifier") return validateIdentifier(value);
    if (field === "password" && !value) return "Password is required.";
    return "";
  }

  function set(field) {
    return (e) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      setError("");
      // Only live-validate once the field has already been flagged invalid,
      // so a fresh field doesn't turn red before the user's even left it.
      setFieldErrors((fe) => (fe[field] ? { ...fe, [field]: validateField(field, value) } : fe));
    };
  }

  function handleBlur(field) {
    return (e) => {
      setFieldErrors((fe) => ({ ...fe, [field]: validateField(field, e.target.value) }));
    };
  }

  // Shared by password sign-in and Google sign-in: resolves the destination
  // by the *resulting* role/device, since neither knows in advance whether
  // this is a community owner or a mobile-only member.
  async function resolveDestination(user) {
    if (user?.isPlatformAdmin) return "/dashboard/admin-panel";
    if (user?.isAdmin) return "/dashboard/home";

    // The member app is mobile-only — a non-admin signing in from a
    // desktop/tablet gets the QR handoff instead of a layout that was
    // never built for that viewport.
    if (!isMobileDevice()) return mobileRequiredPath("/member/app-sign-in");

    // A community's generic shareable "Invite Link" (?community=, see
    // useJoinCommunityParam) has no personal token — clicking it as a user
    // who *already has an account but wasn't signed in* lands here via
    // Join.jsx's "Sign in to accept the invite" link with ?return=/member/invites
    // already set, which used to short-circuit the very next check below
    // before the join request was ever actually submitted. Submit it here,
    // before that shortcut, so it isn't silently dropped.
    const pendingCommunity = sessionStorage.getItem(JOIN_COMMUNITY_KEY);
    if (pendingCommunity) {
      sessionStorage.removeItem(JOIN_COMMUNITY_KEY);
      try {
        await submitJoinRequest(pendingCommunity);
        toastSuccess("Join request sent", { description: "The community admin will review it shortly." });
      } catch (err) {
        notifyError(err, { context: "Join community" });
      }
    }

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

    // login() has already succeeded by the time we get here -- a failure in
    // either of these two lookups must not surface as "Incorrect email or
    // password" (handleSignIn's catch would otherwise blame the wrong step).
    let invites = [];
    try {
      const inviteRes = await getMyInvites();
      const inviteData = inviteRes?.data?.data;
      invites = Array.isArray(inviteData) ? inviteData : (inviteData?.content ?? []);
    } catch {
      // fall through with invites = []
    }

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
    const identifierError = validateField("identifier", form.identifier);
    const passwordError = validateField("password", form.password);
    if (identifierError || passwordError) {
      setFieldErrors({ identifier: identifierError, password: passwordError });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await login({ ...parseIdentifier(form.identifier), password: form.password });
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

  // ── Passwordless (OTP) handlers ───────────────────────────────────────────
  async function handleSendOtp() {
    const identifierError = validateIdentifier(otpIdentifier);
    if (identifierError) {
      setOtpIdentifierError(identifierError);
      return;
    }
    setOtpSending(true);
    setOtpIdentifierError("");
    try {
      const result = await requestLoginOtp(parseIdentifier(otpIdentifier));
      const seconds = Math.max(0, Math.round((new Date(result.expiresAt) - Date.now()) / 1000));
      setOtpInitialSeconds(seconds);
      setResendCount((c) => c + 1);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpStep("verify");
    } catch (err) {
      setOtpIdentifierError(notifyError(err, { context: "Send login code" }));
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.some((d) => !d) || otpCodeExpired) return;
    setOtpVerifying(true);
    setOtpError("");
    try {
      const result = await verifyLoginOtp({ ...parseIdentifier(otpIdentifier), token: otp.join("") });
      if (result?.mfaRequired) {
        setMfaChallenge({ mfaChallengeToken: result.mfaChallengeToken });
        setTimeout(() => mfaInputRef.current?.focus(), 50);
        return;
      }
      const user = await setSession(result);
      navigate(await resolveDestination(user), { replace: true });
    } catch (err) {
      setOtpError(notifyError(err, { context: "Verify login code", fallback: "Invalid or expired code." }));
    } finally {
      setOtpVerifying(false);
    }
  }

  async function handleResendOtp() {
    setOtpSending(true);
    setOtpError("");
    try {
      const result = await requestLoginOtp(parseIdentifier(otpIdentifier));
      const seconds = Math.max(0, Math.round((new Date(result.expiresAt) - Date.now()) / 1000));
      setOtpInitialSeconds(seconds);
      setResendCount((c) => c + 1);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      const retryAfter = getRetryAfterSeconds(err);
      if (retryAfter) {
        setResendCooldown(retryAfter);
        setResendCooldownKey((k) => k + 1);
        setOtpError(`Too many attempts — try again in ${formatCountdown(retryAfter)}.`);
      } else {
        setOtpError(getErrorMessage(err, "Couldn't resend. Please try again."));
      }
    } finally {
      setOtpSending(false);
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

  const isReady = form.identifier.trim() && form.password;

  // ── MFA challenge screen ──────────────────────────────────────────────────────
  if (mfaChallenge) {
    return (
      <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
        <div className="w-full max-w-md flex flex-col my-auto gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <ShieldCheck size={22} className="text-brand" />
            </div>
            <div>
              <h1 className="text-headline text-gray-900 mb-1">Enter MFA Code</h1>
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
              error={error}
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
            onClick={() => {
              setMfaChallenge(null);
              setMfaCode("");
              setError("");
              // The OTP that got here has already been consumed -- land back
              // on a clean identifier screen, not a stale code-entry one.
              if (mode === "otp") setOtpStep("request");
            }}
            className="text-sm text-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
          >
            ← Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ── OTP verify screen — focused, no tabs, mirrors OTPStep.jsx's registration
  // pattern ──────────────────────────────────────────────────────────────────
  if (mode === "otp" && otpStep === "verify") {
    return (
      <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
        <div className="w-full max-w-md flex flex-col my-auto">
          <div className="mb-7">
            <h1 className="text-headline text-gray-900 mb-3 font-sans">Enter Your Code</h1>
            <p className="text-sm text-gray-500 mb-0.5">Enter the 6-digit code sent to</p>
            <p className="text-sm font-semibold text-gray-900">{otpIdentifier}</p>
            <button
              onClick={() => { setOtpStep("request"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
              className="text-sm font-medium mt-1 hover:underline text-[#1B2FE8] bg-transparent border-none cursor-pointer p-0"
            >
              Use a different email or number
            </button>
            <p className={`text-xs mt-2 ${otpCodeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {otpCodeExpired
                ? "Your code has expired — request a new one below."
                : `Code expires in ${formatCountdown(otpSecondsLeft)}`}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <OtpBoxes
              value={otp}
              onChange={(next) => { setOtp(next); setOtpError(""); }}
              length={6}
              autoFocus
              disabled={otpVerifying}
              renderBoxes={(digits, activeIndex) => (
                <div className="flex items-center gap-2 justify-center pointer-events-none">
                  {digits.slice(0, 3).map((d, i) => (
                    <div key={i} className={`w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all border-[1.5px] ${d || i === activeIndex ? "border-primary" : "border-[#C2C2C2]"}`}>
                      {d}
                    </div>
                  ))}
                  <span className="text-gray-400 text-lg font-medium px-1">—</span>
                  {digits.slice(3, 6).map((d, i) => {
                    const idx = i + 3;
                    return (
                      <div key={idx} className={`w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all border-[1.5px] ${d || idx === activeIndex ? "border-primary" : "border-[#C2C2C2]"}`}>
                        {d}
                      </div>
                    );
                  })}
                </div>
              )}
            />

            {otpError && <p className="text-sm text-red-500 text-center -mt-2">{otpError}</p>}

            <PrimaryButton onClick={handleVerifyOtp} loading={otpVerifying} disabled={otpCodeExpired || otp.some((d) => !d)}>
              {otpVerifying ? "Verifying…" : "Verify & Sign In"}
            </PrimaryButton>
          </div>

          <p className="text-center text-sm mt-5 text-gray-text">
            Didn't get a code?{" "}
            <button
              onClick={handleResendOtp}
              disabled={otpSending || resendSecondsLeft > 0}
              className="font-semibold hover:underline disabled:opacity-60 text-[#1B2FE8] bg-transparent border-none cursor-pointer p-0"
            >
              {otpSending ? "Resending…" : resendSecondsLeft > 0 ? `Resend in ${formatCountdown(resendSecondsLeft)}` : "Resend"}
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
      <div className="w-full max-w-md flex flex-col my-auto gap-6">
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
              className="text-xs font-semibold mt-2 inline-block text-[#92400e]"
            >
              Back to registration →
            </Link>
          </div>
        )}
        <div>
          <h1 className="text-headline text-gray-900 mb-1">Sign in To Your Account</h1>
          <p className="text-sm text-gray-500">
            {mode === "otp" ? "We'll email or text you a one-time code — no password needed." : "Enter your credentials to continue."}
          </p>
        </div>

        <ModeTabs mode={mode} setMode={switchMode} disabled={loading || otpSending} />

        {mode === "password" ? (
          <>
            <div>
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <TextInput
                id="identifier"
                type="text"
                placeholder="you@example.com or 0803 123 4567"
                value={form.identifier}
                onChange={set("identifier")}
                onBlur={handleBlur("identifier")}
                autoComplete="username"
                disabled={loading}
                error={fieldErrors.identifier}
              />
              <ErrorMessage message={fieldErrors.identifier} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-[#1C2B8A]">
                  Forgot password?
                </Link>
              </div>
              <TextInput
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={set("password")}
                onBlur={handleBlur("password")}
                autoComplete="current-password"
                disabled={loading}
                error={fieldErrors.password}
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
              <ErrorMessage message={fieldErrors.password || error} />
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
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="otp-identifier">Email or Phone Number</Label>
              <TextInput
                id="otp-identifier"
                type="text"
                placeholder="you@example.com or 0803 123 4567"
                value={otpIdentifier}
                onChange={(e) => { setOtpIdentifier(e.target.value); setOtpIdentifierError(""); }}
                onBlur={() => setOtpIdentifierError(validateIdentifier(otpIdentifier))}
                autoComplete="username"
                disabled={otpSending}
                error={otpIdentifierError}
              />
              <ErrorMessage message={otpIdentifierError} />
            </div>

            <PrimaryButton onClick={handleSendOtp} loading={otpSending} disabled={!otpIdentifier.trim()}>
              {otpSending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending code…</span>
                </span>
              ) : (
                "Send Code"
              )}
            </PrimaryButton>
          </>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleAuthButton onAuthenticated={handleGoogleAuth} label="signin_with" />

        {isMemberSignIn ? (
          !isReturningVisitor && (
            <p className="text-sm text-center text-gray-500 pb-2">
              New to Glass?{" "}
              <span className="font-semibold text-[#1C2B8A]">
                Use the invite link your admin shared with you.
              </span>
            </p>
          )
        ) : (
          <p className="text-sm text-center text-gray-500 pb-2">
            New User?{" "}
            <Link to="/sign-up" className="font-semibold text-[#1C2B8A]">
              Create Account
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
