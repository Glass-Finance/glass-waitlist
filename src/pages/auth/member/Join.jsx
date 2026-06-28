import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Info } from "lucide-react";
import { useInviteToken } from "../../../hooks/useInviteToken";
import { register, verifyEmail, resendVerification } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../utils/password";
import { useAuth } from "../../../store/AuthContext";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../../assets/cta/ctalogo.png";
import authHeroBg from "../../../assets/auth/mobile-auth.png";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OTP_LENGTH = 6;
const STEPS = { PROFILE: "profile", OTP: "otp" };

// ---------------------------------------------------------------------------
// Shared primitives — light sheet style (matches Figma)
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
        className="w-full rounded-md px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white focus:bg-white disabled:opacity-50 autofill:text-gray-900"
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
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-full bg-[#002FA7] text-white font-semibold text-[15px] transition-all hover:opacity-90 disabled:cursor-not-allowed cursor-pointer"
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
    <div className="flex justify-center items-start min-h-screen bg-[#EFEFEF]">
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
            overflow: "hidden",
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
function StepOTP({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  function handleDigitChange(index, value) {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...digits];
      pasted.forEach((ch, i) => {
        if (i < OTP_LENGTH) next[i] = ch;
      });
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ email, token: code });
      onVerified(result);
    } catch (err) {
      setError(notifyError(err, { context: "Verify OTP", fallback: "That code didn't work. Please try again.", silent: true }));
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setError("");
    try {
      await resendVerification({ email });
    } catch (err) {
      setError(notifyError(err, { context: "Resend OTP", fallback: "Could not resend. Please try again.", silent: true }));
    }
  }

  // Figma shows: [box][box][box] — [box][box][box]
  const firstThree = [0, 1, 2];
  const lastThree = [3, 4, 5];
  const allFilled = digits.every(Boolean);

  function OTPBox({ index }) {
    return (
      <input
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digits[index]}
        onChange={(e) => handleDigitChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        autoComplete={index === 0 ? "one-time-code" : "off"}
        aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
        className="
        w-10 h-12
        sm:w-12 sm:h-14
        rounded-lg
        text-center
        text-lg
        font-bold
        text-gray-900
        outline-none
        transition-all
        duration-150
        caret-transparent
        bg-white
        flex-shrink-0
      "
        style={{
          border: digits[index] ? "2px solid #1C2B8A" : "1.5px solid #D0D5E8",
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900  my-5">
          Verification Code Sent
        </h1>
        <p className="text-md text-gray-500 mb-2">
          Enter the 6-digit code that was sent to
        </p>
        <p className="font-semibold text-md text-gray-900 mb-2">{email}</p>
        <button
          onClick={onBack}
          className="text-sm font-medium mt-1"
          style={{ color: "#1C2B8A" }}
        >
          Wrong email?
        </button>
      </div>

      {/* OTP boxes — split with dash */}
      <div className="w-full overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {firstThree.map((i) => (
              <OTPBox key={i} index={i} />
            ))}
          </div>

          <span className="text-gray-400 text-xl font-light flex-shrink-0">
            —
          </span>

          <div className="flex gap-2">
            {lastThree.map((i) => (
              <OTPBox key={i} index={i} />
            ))}
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      <PrimaryButton
        onClick={handleVerify}
        loading={loading}
        disabled={!allFilled}
      >
        Continue
      </PrimaryButton>

      <p className="text-sm text-center text-gray-500 pb-2">
        Didn't get OTP?{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-semibold disabled:opacity-40"
          style={{ color: "#1C2B8A" }}
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

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  function handleSubmit() {
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
    if (!isPasswordValid(form.password)) {
      setError(`Password must include: ${PASSWORD_REQUIREMENTS_TEXT.toLowerCase()}`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    onSubmit({ ...form, email: trimmedEmail, loading: setLoading, setError });
  }

  const isReady =
    form.email.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.password &&
    form.confirmPassword;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 mt-5">
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
        <p className="text-xs text-gray-500 mt-1.5 px-1">
          {PASSWORD_REQUIREMENTS_TEXT}
        </p>
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

      <GoogleAuthButton onAuthenticated={onGoogleAuth} label="signup_with" />

      <p className="text-sm text-center text-gray-500 pb-2">
        Already Have An Account?{" "}
        <Link
          to="/member/app-sign-in"
          className="font-semibold"
          style={{ color: "#1C2B8A" }}
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
  const { setSession } = useAuth();

  const [step, setStep] = useState(STEPS.PROFILE);
  const [email, setEmail] = useState("");

  // Some backends issue a session immediately on register, others only
  // after email verification — store it the moment either response
  // actually includes a token, instead of assuming which step does it
  // (matches the admin SignUp flow's same pattern).
  function maybeStoreSession(authData) {
    if (authData?.accessToken) setSession(authData);
  }

  function finishAndRoute() {
    consumeToken();
    navigate(token ? "/member/home" : "/member/invites", { replace: true });
  }

  // Google already proves the user owns this email, so registration is
  // immediate — no OTP step needed. Note: the invite token isn't sent to
  // /auth/google today (it only takes a credential), so it's never
  // actually applied here — unlike finishAndRoute() above (used after the
  // regular register()+OTP flow, which does send the token), a pending
  // invite needs /member/invites to accept it manually instead of
  // /member/home, the opposite direction of finishAndRoute()'s ternary.
  // Google also never gives us a name, so a brand-new account detours
  // through one extra step to collect what the rest of Glass assumes
  // every account has.
  function handleGoogleAuth(_user, { profileComplete } = {}) {
    consumeToken();
    const next = token ? "/member/invites" : "/member/home";
    if (!profileComplete) {
      navigate("/member/complete-profile", { state: { next } });
      return;
    }
    navigate(next, { replace: true });
  }

  function handleBack() {
    if (step === STEPS.OTP) setStep(STEPS.PROFILE);
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
    loading: setLoading,
    setError,
  }) {
    try {
      const payload = {
        email: enteredEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        password,
        ...(token && { inviteToken: token }),
      };
      const authData = await register(payload);
      maybeStoreSession(authData);
      setEmail(enteredEmail);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(notifyError(err, { context: "Member register" }));
    } finally {
      setLoading(false);
    }
  }

  function handleVerified(authData) {
    maybeStoreSession(authData);
    finishAndRoute();
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
