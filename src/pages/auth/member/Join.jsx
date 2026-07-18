import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Info } from "lucide-react";
import { useInviteToken } from "../../../hooks/useInviteToken";
import { useJoinCommunityParam } from "../../../hooks/useJoinCommunityParam";
import { register, verifyEmail, resendVerification } from "../../../services/authService";
import { submitJoinRequest } from "../../../api/invites";
import { notifyError } from "../../../utils/errorHandler";
import { toastSuccess } from "../../../utils/toast";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../utils/password";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../utils/phone";
import { useAuth } from "../../../store/AuthContext";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";
import LoadingState from "../../../components/common/LoadingState";
import PasswordChecklist from "../../../components/auth/PasswordChecklist";
import OtpBoxes from "../../../components/common/OtpBoxes";
import { useCountdown, formatCountdown } from "../../../hooks/useCountdown";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../../assets/cta/ctalogo.webp";
import authHeroBg from "../../../assets/auth/mobile-auth.webp";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OTP_LENGTH = 6;
const STEPS = { PROFILE: "profile", OTP: "otp" };
// Codes are valid for 15 minutes (see SignIn.jsx and the spam-notice copy below).
const OTP_VALIDITY_SECONDS = 15 * 60;

// ---------------------------------------------------------------------------
// Shared primitives — light sheet style (matches Figma)
// ---------------------------------------------------------------------------
function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-label font-medium mb-1.5"
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
        className="w-full rounded-md px-4 py-3.5 text-placeholder text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white focus:bg-white disabled:opacity-50 autofill:text-gray-900"
        style={{
          backgroundColor: "#FFFFFF",
          border: focused ? "1.5px solid #797D86" : "1.5px solid #E0E0E6",
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

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
}) {
  return (
    // <button
    //   type={type}
    //   onClick={onClick}
    //   disabled={disabled || loading}
    //   className="w-full rounded-full py-4 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
    //   style={{ background: disabled || loading ? "#B0B8D8" : "#1C2B8A" }}
    // >
    //   {loading ? (
    //     <span className="flex items-center justify-center gap-2">
    //       <Loader2 size={16} className="animate-spin" />
    //       <span>Please wait…</span>
    //     </span>
    //   ) : (
    //     children
    //   )}
    // </button>
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-full bg-[#002FA7] text-white font-semibold text-button transition-all hover:opacity-90 disabled:cursor-not-allowed cursor-pointer"
    >
      {loading ? "Loading..." : children}
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
// Shell — image top half, sheet bottom half
// ---------------------------------------------------------------------------
function MobileShell({ children, step }) {
  return (
    <div className="flex justify-center items-start min-h-screen bg-surface-bg">
      <div
        className="relative w-full max-w-[430px] min-h-screen overflow-hidden flex flex-col"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* ── Top image section (45% height) ── */}
        <div
          className="relative flex-shrink-0"
          style={{
            height: step === STEPS.PROFILE ? "30vh" : "45vh",
            minHeight: step === STEPS.PROFILE ? 180 : 220,
            borderRadius: 0,
            transition: "height 0.45s ease",
          }}
        >
          <img
            src={authHeroBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Logo */}
          <img
            src={glassLogo}
            alt="Glass"
            className="absolute top-10 left-5 h-9 w-auto object-contain"
            draggable={false}
            // style={{ filter: "brightness(0) invert(1)" }}
          />
          {/* Tagline */}
          {/* <p
            className="absolute bottom-10 left-0 right-0 text-center text-white font-normal leading-snug px-8"
            style={{ fontSize: "clamp(20px,4vw,22px)" }}
          >
            Manage Your Community
            <br />
            Finance Effortlessly
          </p> */}
          {step === STEPS.OTP && (
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-white text-center font-normal text-[clamp(20px,5vw,24px)] leading-tight px-6">
                Manage Your Community
                <br />
                Finance Effortlessly
              </h1>
            </div>
          )}
        </div>

        {/* ── Bottom sheet (55% height) ── */}
        <div
          className="flex-1 flex flex-col px-6 pt-2 pb-safe z-30"
          style={{
            background: "#E5E5E5F2",
            borderRadius: "20px 20px 0 0",
            marginTop: -28,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {children}
          {/* iOS safe area */}
          <div style={{ height: "env(safe-area-inset-bottom, 20px)" }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — OTP  (6 boxes with dash in middle like Figma)
// ---------------------------------------------------------------------------
const PENDING_KEY = "glass_pending_member_verification";

function StepOTP({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  // Separate from resendCount (which drives the 15-min expiry countdown
  // below and must only change on an actual resend) — this only forces
  // OtpBoxes to remount so autoFocus re-fires after clearing the boxes,
  // on either a resend or a failed verify attempt.
  const [otpAttempt, setOtpAttempt] = useState(0);

  const secondsLeft = useCountdown(OTP_VALIDITY_SECONDS, `${email}-${resendCount}`);
  const codeExpired = secondsLeft <= 0;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  function handleDigitChange(next) {
    setDigits(next);
    setError("");
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ email, token: code });
      sessionStorage.removeItem(PENDING_KEY);
      onVerified(result);
    } catch (err) {
      setError(notifyError(err, { context: "Verify OTP", fallback: "That code didn't work. Please try again.", silent: true }));
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpAttempt((a) => a + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    setError("");
    try {
      await resendVerification({ email });
      setResendCount((c) => c + 1);
      setOtpAttempt((a) => a + 1);
      setDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setError(notifyError(err, { context: "Resend OTP", fallback: "Could not resend. Please try again.", silent: true }));
    }
  }

  const allFilled = digits.every(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline text-gray-900 my-5">
          Verification Code Sent
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          Enter the 6-digit code sent to
        </p>
        <p className="font-semibold text-sm text-gray-900 mb-1">{email}</p>
        <button
          onClick={() => { sessionStorage.removeItem(PENDING_KEY); onBack(); }}
          className="text-sm font-medium mt-1 text-[#1C2B8A]"
        >
          Wrong email?
        </button>
        <p className={`text-xs mt-2 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
          {codeExpired
            ? "Your code has expired — request a new one below."
            : `Code expires in ${formatCountdown(secondsLeft)}`}
        </p>
      </div>

      {/* Spam notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Can't find the email?</span> Check your spam or junk folder — emails from Yahoo addresses often end up there. If the code has expired, tap <span className="font-semibold">Resend</span> to get a new one. If you accidentally closed this page and came back, you can enter the original code if it's still within 15 minutes, or resend to get a fresh one.
        </p>
      </div>

      {/* Wrapping in a real <form> matches WebKit's own documented pattern
          for autocomplete="one-time-code" and gets the iOS keyboard's
          Return/Go key to submit for free. The "Resend" button below stays
          outside this form — see the note above it. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (allFilled && !codeExpired) handleVerify();
        }}
        className="flex flex-col gap-6"
      >
      {/* OTP boxes — split with dash. Boxes are flex-1 (not a fixed pixel
          width) so all 6 shrink together to fit narrow screens (e.g.
          iPhone SE / 360px Android) instead of overflowing the viewport. */}
      <OtpBoxes
        key={otpAttempt}
        value={digits}
        onChange={handleDigitChange}
        length={OTP_LENGTH}
        autoFocus
        renderBoxes={(boxDigits, activeIndex) => (
          <div className="flex items-center justify-between gap-1.5 pointer-events-none">
            <div className="flex gap-1.5 flex-1 min-w-0">
              {boxDigits.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                  className="flex-1 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-gray-900 bg-white transition-all duration-150"
                  style={{ minWidth: 0, maxWidth: 48, border: d || i === activeIndex ? "2px solid #1C2B8A" : "1.5px solid #D0D5E8", fontSize: 22 }}
                >
                  {d}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-xl font-light flex-shrink-0">—</span>
            <div className="flex gap-1.5 flex-1 min-w-0">
              {boxDigits.slice(3, 6).map((d, i) => {
                const idx = i + 3;
                return (
                  <div
                    key={idx}
                    aria-label={`Digit ${idx + 1} of ${OTP_LENGTH}`}
                    className="flex-1 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-gray-900 bg-white transition-all duration-150"
                    style={{ minWidth: 0, maxWidth: 48, border: d || idx === activeIndex ? "2px solid #1C2B8A" : "1.5px solid #D0D5E8", fontSize: 22 }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      />

      <ErrorMessage message={error} />

      <PrimaryButton onClick={handleVerify} loading={loading} disabled={!allFilled || codeExpired}>
        Continue
      </PrimaryButton>
      </form>

      {/* Deliberately outside the <form>: a bare <button> with no explicit
          type defaults to type="submit" inside a form, which would have
          triggered the form's onSubmit (and double-fired handleVerify) on
          click. */}
      <p className="text-sm text-center text-gray-500 pb-2">
        Didn't get OTP?{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-semibold disabled:opacity-40 text-[#1C2B8A]"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Profile (email + name + phone + password) — collects everything
// register() needs in one step, since the backend only sends a
// verification code after the account actually exists, not before.
// ---------------------------------------------------------------------------
function StepProfile({ onSubmit, onGoogleAuth }) {
  const { hasToken } = useInviteToken();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
      setAccountExists(false);
    };
  }

  function handleSubmit() {
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    const trimmedEmail = form.email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!isPhoneValid(form.phone)) {
      setError(PHONE_FORMAT_HINT);
      return;
    }
    if (!isPasswordValid(form.password)) {
      setError(`Password must include: ${PASSWORD_REQUIREMENTS_TEXT.toLowerCase()}`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    setAccountExists(false);
    onSubmit({ ...form, email: trimmedEmail, loading: setLoading, setError, setAccountExists });
  }

  const isReady =
    form.email.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.password &&
    form.confirmPassword &&
    agreed;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-headline text-gray-900 mt-5">
          {hasToken ? "You've Been Invited" : "Create Your Account"}
        </h1>
        {hasToken && (
          <p className="text-sm text-gray-500 mt-1">
            Complete your profile to accept the invite.
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">Email Address</Label>
        <TextInput
          id="email"
          type="email"
          placeholder="e.g Bax**re@gmail.com"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
          inputMode="email"
          disabled={loading}
        />
      </div>

      {/* First + Last */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="firstName">First Name</Label>
          <TextInput
            id="firstName"
            placeholder="Enter First Name"
            value={form.firstName}
            onChange={set("firstName")}
            autoComplete="given-name"
            disabled={loading}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="lastName">Last Name</Label>
          <TextInput
            id="lastName"
            placeholder="Enter Last Name"
            value={form.lastName}
            onChange={set("lastName")}
            autoComplete="family-name"
            disabled={loading}
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <TextInput
          id="phone"
          type="tel"
          placeholder="e.g. 0803 123 4567"
          value={form.phone}
          onChange={set("phone")}
          autoComplete="tel"
          inputMode="tel"
          disabled={loading}
        />
        <div className="flex items-start gap-1.5 mt-1.5">
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-snug">
            This number should be linked to an active WhatsApp account — we'll use it to send you updates.
          </p>
        </div>
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Create Password</Label>
        <TextInput
          key={showPw ? "text" : "password"}
          id="password"
          type={showPw ? "text" : "password"}
          placeholder="Enter Your Password"
          value={form.password}
          onChange={set("password")}
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
        <PasswordChecklist password={form.password} />
      </div>

      {/* Confirm password */}
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <TextInput
          id="confirmPassword"
          type={showCpw ? "text" : "password"}
          placeholder="re-enter Password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          autoComplete="new-password"
          disabled={loading}
          rightElement={
            <button
              type="button"
              onClick={() => setShowCpw((v) => !v)}
              className="text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showCpw ? "Hide password" : "Show password"}
            >
              {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </div>

      {accountExists && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            You already have a Glass account with this email. Sign in and your invite will be waiting for you.
          </p>
          <Link
            to="/member/app-sign-in?return=/member/invites"
            className="inline-block mt-2 text-xs font-semibold text-[#1C2B8A]"
          >
            Sign in to accept the invite
          </Link>
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded flex-shrink-0 cursor-pointer"
          style={{ accentColor: "#1C2B8A" }}
        />
        <span className="text-xs text-gray-500 leading-snug">
          I agree to the{" "}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[#1C2B8A]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[#1C2B8A]"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <ErrorMessage message={error} />

      <PrimaryButton
        onClick={handleSubmit}
        loading={loading}
        disabled={!isReady}
      >
        Create Account
      </PrimaryButton>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <div
        className={!agreed ? "opacity-50 pointer-events-none" : ""}
        title={!agreed ? "Agree to the Terms of Service and Privacy Policy first" : undefined}
      >
        <GoogleAuthButton onAuthenticated={onGoogleAuth} label="signup_with" />
      </div>

      <p className="text-sm text-center text-gray-500 pb-2">
        Already Have An Account?{" "}
        <Link
          to="/member/app-sign-in"
          className="font-semibold text-[#1C2B8A]"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Join root
// ---------------------------------------------------------------------------
export default function Join() {
  const navigate = useNavigate();
  const { token, consumeToken } = useInviteToken();
  const { community, consumeCommunity } = useJoinCommunityParam();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();

  // A user who already has a session (e.g. they're a member of another
  // community, or just left themselves logged in) shouldn't be forced
  // through the signup form just because they clicked an invite/join link —
  // join them into the community directly instead. Mirrors InviteLanding.jsx's
  // same already-authenticated short-circuit for the personalized-invite path.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (community) {
      consumeCommunity();
      submitJoinRequest(community)
        .then(() => {
          toastSuccess("Join request sent", { description: "The community admin will review it shortly." });
        })
        .catch((err) => notifyError(err, { context: "Join community" }))
        .finally(() => navigate("/member/invites", { replace: true }));
      return;
    }
    // A personalized invite token only matters for account creation
    // (sent along with register()) — an already-authenticated user's
    // invite already exists server-side under their email, so just take
    // them to where every pending invite/join-request shows up.
    if (token) {
      consumeToken();
      navigate("/member/invites", { replace: true });
    }
  }, [authLoading, isAuthenticated, community, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const [email, setEmail] = useState(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      return pending ? JSON.parse(pending).email : "";
    } catch { return ""; }
  });
  const [step, setStep] = useState(() =>
    email ? STEPS.OTP : STEPS.PROFILE
  );

  // Some backends issue a session immediately on register, others only
  // after email verification — store it the moment either response
  // actually includes a token, instead of assuming which step does it
  // (matches the admin SignUp flow's same pattern).
  function maybeStoreSession(authData) {
    if (authData?.accessToken) setSession(authData);
  }

  // The community's own generic, shareable "Invite Link" (?community=) has
  // no personal token to send at registration, unlike a personalized
  // invite — it goes through its own join-request call once the account
  // exists, then routes to /member/invites the same way a pending
  // personalized invite does, since both are "waiting on something" states
  // from the member's point of view.
  async function submitCommunityJoinAndRoute() {
    consumeCommunity();
    try {
      await submitJoinRequest(community);
      toastSuccess("Join request sent", { description: "The community admin will review it shortly." });
    } catch (err) {
      notifyError(err, { context: "Join community" });
    }
    navigate("/member/invites", { replace: true });
  }

  function finishAndRoute() {
    consumeToken();
    if (community) {
      submitCommunityJoinAndRoute();
      return;
    }
    // A personalized invite grants access immediately (unlike the
    // join-request path above, which has its own confirmation toast) — say
    // so explicitly rather than silently dropping the new member onto Home
    // with no context for what just happened.
    if (token) toastSuccess("You're in!", { description: "Welcome to the community." });
    navigate(token ? "/member/home" : "/member/invites", { replace: true });
  }

  // Google already proves the user owns this email, so registration is
  // immediate — no OTP step needed. Note: the invite token isn't sent to
  // /auth/google today (it only takes a credential), so it's never
  // actually applied here — unlike finishAndRoute() above (used after the
  // regular register()+OTP flow, which does send the token), a pending
  // invite needs /member/invites to accept it manually instead of
  // /member/home, the opposite direction of finishAndRoute()'s ternary.
  function handleGoogleAuth() {
    consumeToken();
    if (community) {
      submitCommunityJoinAndRoute();
      return;
    }
    navigate(token ? "/member/invites" : "/member/home", { replace: true });
  }

  function handleBack() {
    if (step === STEPS.OTP) {
      sessionStorage.removeItem(PENDING_KEY);
      setStep(STEPS.PROFILE);
    }
  }

  // Registration has to happen before any verification code can be sent —
  // there's no account yet to send one for. This was previously inverted
  // (collecting just an email and calling a nonexistent /api/auth/send-otp
  // before the account existed), which is why no code was ever delivered.
  async function handleProfileSubmit({
    email: enteredEmail,
    firstName,
    lastName,
    phone,
    password,
    confirmPassword,
    loading: setLoading,
    setError,
    setAccountExists,
  }) {
    try {
      const payload = {
        email: enteredEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        password,
        confirmPassword,
        ...(token && { inviteToken: token }),
      };
      const authData = await register(payload);
      maybeStoreSession(authData);
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email: enteredEmail }));
      setEmail(enteredEmail);
      setStep(STEPS.OTP);
    } catch (err) {
      // The invited email already belongs to a registered account (e.g.
      // someone who's already a member of another community) — the
      // backend returns a 409 for this rather than a validation error.
      // Registering them again isn't the right path; they need to sign in
      // instead, at which point resolveDestination() in SignIn.jsx already
      // routes anyone with a pending invite to /member/invites, so the
      // invite still gets honored without needing this token.
      if (err?.response?.status === 409) {
        setAccountExists?.(true);
        setError("");
      } else {
        setError(notifyError(err, { context: "Member register" }));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified(authData) {
    sessionStorage.removeItem(PENDING_KEY);
    if (authData?.accessToken) {
      await setSession(authData);
      finishAndRoute();
    } else {
      // Verify succeeded but no token returned — direct to sign-in so they
      // can log in with the account they just created.
      navigate("/member/app-sign-in", { replace: true });
    }
  }

  // Still resolving the session, or an already-authenticated user is being
  // routed straight into the community — show a clean loading state rather
  // than flashing the signup form first.
  if (authLoading || (isAuthenticated && (community || token))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-bg">
        <LoadingState size={18} />
      </div>
    );
  }

  return (
    <MobileShell step={step}>
      {step === STEPS.PROFILE && (
        <StepProfile onSubmit={handleProfileSubmit} onGoogleAuth={handleGoogleAuth} />
      )}
      {step === STEPS.OTP && (
        <StepOTP email={email} onVerified={handleVerified} onBack={handleBack} />
      )}
    </MobileShell>
  );
}
