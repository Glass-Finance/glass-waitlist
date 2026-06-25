import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Info } from "lucide-react";
import { useInviteToken } from "../../hooks/useInviteToken";
import { register, storeAuthSession } from "../../services/authService";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../assets/cta/ctalogo.png";
import authHeroBg from "../../assets/auth/mobile-auth.png";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OTP_LENGTH = 6;
const STEPS = { EMAIL: "email", OTP: "otp", PROFILE: "profile" };
const showHeroText =
  location.pathname === "/signup" || location.pathname === "/verify-email";

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

function GoogleButton() {
  return (
    <button
      type="button"
      className="w-full rounded-full py-4 text-sm font-medium text-gray-800 bg-white flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer"
      style={{ border: "1.5px solid #E0E0E6" }}
      onClick={() => {
        /* wire up Google OAuth */
      }}
    >
      {/* Google G SVG */}
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      Sign Up With Google
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
          {(step === STEPS.EMAIL || step === STEPS.OTP) && (
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
// Step 1 — Email
// ---------------------------------------------------------------------------
function StepEmail({ onNext }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { hasToken } = useInviteToken();

  async function handleContinue() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      onNext({ email: trimmed });
    } catch {
      setError("Couldn't send a code. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1 mt-5">
          {hasToken ? "You've been invited" : "Create Your Account"}
        </h1>
        {hasToken && (
          <p className="text-sm text-gray-500">
            Enter your email to accept the invite.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <TextInput
          id="email"
          type="email"
          placeholder="e.g Bax**re@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          autoComplete="email"
          inputMode="email"
          disabled={loading}
        />
        <ErrorMessage message={error} />
      </div>

      <PrimaryButton
        onClick={handleContinue}
        loading={loading}
        disabled={!email.trim()}
        className="cursor-pointer"
      >
        Continue
      </PrimaryButton>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <GoogleButton />

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
// Step 2 — OTP  (6 boxes with dash in middle like Figma)
// ---------------------------------------------------------------------------
function StepOTP({ email, onNext, onBack }) {
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
      await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      onNext({ otp: code });
    } catch {
      setError("That code didn't work. Please try again.");
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
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
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
// Step 3 — Complete profile (Figma: first, last, password, confirm password)
// ---------------------------------------------------------------------------
function StepProfile({ email, onSubmit }) {
  const [form, setForm] = useState({
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
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    onSubmit({ ...form, loading: setLoading, setError });
  }

  const isReady =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.password &&
    form.confirmPassword;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 mt-5">
          Complete Your Profile
        </h1>
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

      <p className="text-sm text-center text-gray-500 pb-2">
        Didn't get OTP?{" "}
        <button className="font-semibold" style={{ color: "#1C2B8A" }}>
          Resend
        </button>
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

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");

  function handleEmailNext({ email: e }) {
    setEmail(e);
    setStep(STEPS.OTP);
  }
  function handleOTPNext() {
    setStep(STEPS.PROFILE);
  }
  function handleBack() {
    if (step === STEPS.OTP) setStep(STEPS.EMAIL);
    if (step === STEPS.PROFILE) setStep(STEPS.OTP);
  }

  async function handleProfileSubmit({
    firstName,
    lastName,
    phone,
    password,
    loading: setLoading,
    setError,
  }) {
    try {
      const payload = {
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        password,
        ...(token && { inviteToken: token }),
      };
      const authData = await register(payload);
      storeAuthSession(authData);
      consumeToken();
      navigate(token ? "/member/home" : "/member/invites", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <MobileShell step={step}>
      {step === STEPS.EMAIL && <StepEmail onNext={handleEmailNext} />}
      {step === STEPS.OTP && (
        <StepOTP email={email} onNext={handleOTPNext} onBack={handleBack} />
      )}
      {step === STEPS.PROFILE && (
        <StepProfile email={email} onSubmit={handleProfileSubmit} />
      )}
    </MobileShell>
  );
}
