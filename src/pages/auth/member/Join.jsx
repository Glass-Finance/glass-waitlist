import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Info } from "lucide-react";
import { useInviteToken } from "../../../hooks/useInviteToken";
import { useJoinCommunityParam } from "../../../hooks/useJoinCommunityParam";
import { useJoinEmailParam } from "../../../hooks/useJoinEmailParam";
import { recordPendingJoinRequest } from "../../../hooks/useJoinApproval";
import { register, verifyEmail, resendVerification, requestLoginOtp, verifyLoginOtp } from "../../../services/authService";
import PhoneOTPStep from "../SignUp/PhoneOTPStep";
import { submitJoinRequest } from "../../../api/invites";
import { notifyError } from "../../../utils/errorHandler";
import { toastSuccess } from "../../../utils/toast";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../utils/password";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../utils/phone";
import { getEmailError } from "../../../utils/validators";
import { useAuth } from "../../../store/AuthContext";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";
import PageLoadingState from "../../../components/memberApp/PageLoadingState";
import PasswordChecklist from "../../../components/auth/PasswordChecklist";
import OtpBoxes from "../../../components/common/OtpBoxes";
import { useCountdown, formatCountdown } from "../../../hooks/useCountdown";
import AuthLayout from "../../../layouts/AuthLayout";
import { Button as PrimaryButton } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OTP_LENGTH = 6;
// Three steps, mirroring the owner SignUp flow's EmailPhoneStep ->
// RegisterStep -> OTPStep split, instead of collecting everything on one
// screen the way this page used to. SIGNIN_OTP isn't part of that linear
// flow -- it's entered directly, bypassing CONTACT/PROFILE, when arriving
// via CheckEmail.jsx's QR (see StepSignInOtp below).
const STEPS = { CONTACT: "contact", PHONE_OTP: "phoneOtp", PROFILE: "profile", OTP: "otp", SIGNIN_OTP: "signinOtp" };
// Codes are valid for 15 minutes (see SignIn.jsx and the spam-notice copy below).
const OTP_VALIDITY_SECONDS = 15 * 60;
const PENDING_KEY = "glass_pending_member_verification";

// ---------------------------------------------------------------------------
// Shared primitives — light sheet style (matches Figma)
// ---------------------------------------------------------------------------
function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-label font-medium mb-1.5 text-[#111]"
    >
      {children}
    </label>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p
      className="text-xs mt-1.5 px-1 text-[#E53E3E]"
      role="alert"
    >
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Contact (email + phone number) — no API call here, just like
// SignUp's EmailPhoneStep; the fields are handed up to Join()'s local state
// and combined with StepProfile's fields into one register() call once step
// 2 completes, since the backend only sends a verification code after the
// account actually exists.
// ---------------------------------------------------------------------------
function StepContact({ initialEmail, initialPhone, onNext, onGoogleAuth, hasCommunity }) {
  const { hasToken } = useInviteToken();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", phone: "" });
  const [error, setError] = useState("");

  function validatePhone(value) {
    if (!value.trim()) return "Phone number is required.";
    if (!isPhoneValid(value)) return PHONE_FORMAT_HINT;
    return "";
  }

  function handleFieldChange(field, setValue) {
    return (e) => {
      const value = e.target.value;
      setValue(value);
      setError("");
      const validate = field === "email" ? getEmailError : validatePhone;
      setFieldErrors((fe) => (fe[field] ? { ...fe, [field]: validate(value) } : fe));
    };
  }

  function handleSubmit() {
    // Explicit over implicit per CEO direction: the button stays clickable
    // regardless of the checkbox, and tells you exactly why it didn't go
    // through instead of just sitting disabled with no explanation.
    if (!agreed) {
      setError("Please Accept Our Terms to Continue");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    const emailError = getEmailError(trimmedEmail);
    const phoneError = validatePhone(phone);
    if (emailError || phoneError) {
      setFieldErrors({ email: emailError, phone: phoneError });
      return;
    }
    setError("");
    onNext({ email: trimmedEmail, phone: phone.trim() });
  }

  return (
    <div className="w-full max-w-md flex flex-col md:mt-14 gap-3">
      <div>
        <h1 className="text-headline text-gray-900">
          {hasToken ? "You've Been Invited" : "Create Your Account"}
        </h1>
        {hasToken ? (
          <p className="text-sm text-gray-500 mt-1">
            Complete your profile to accept the invite.
          </p>
        ) : !hasCommunity ? (
          // Reached via the marketing site's contextless "Join A Community"
          // CTA, not a specific invite -- says up front that browsing comes
          // after account creation, not before, so the form doesn't read as
          // a bait-and-switch into full registration with no explanation.
          <p className="text-sm text-gray-500 mt-1">
            Create an account, then choose which communities to join.
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <TextInput
          id="email"
          type="email"
          placeholder="Enter Your Email Address"
          value={email}
          onChange={handleFieldChange("email", setEmail)}
          autoComplete="email"
          inputMode="email"
        />
        <ErrorMessage message={fieldErrors.email} />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <TextInput
          id="phone"
          type="tel"
          placeholder="Enter Your Phone Number"
          value={phone}
          onChange={handleFieldChange("phone", setPhone)}
          autoComplete="tel"
          inputMode="tel"
        />
        <ErrorMessage message={fieldErrors.phone} />
        <div className="flex items-start gap-1.5 mt-1.5">
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-snug">
            We'll use this number to send you updates.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
          className="mt-0.5 w-4 h-4 rounded flex-shrink-0 cursor-pointer bg-white border border-gray-300 accent-[#1C2B8A]"
        />
        <span className="text-sm text-gray-700">
          I accept the{" "}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium underline text-[#1C2B8A]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium underline text-[#1C2B8A]"
          >
            Privacy Policy
          </Link>
        </span>
      </label>

      <ErrorMessage message={error} />

      <PrimaryButton onClick={handleSubmit} size="sm">
        Continue
      </PrimaryButton>

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
          className="font-semibold text-[#1C2B8A]"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Profile (name + password) — email/phone already collected in
// StepContact; register() fires here with all of it combined, since the
// backend only issues a verification code once the account actually exists.
// ---------------------------------------------------------------------------
function StepProfile({ onSubmit }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountExists, setAccountExists] = useState(false);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
      setAccountExists(false);
    };
  }

  function handleSubmit() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
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
    onSubmit({ ...form, loading: setLoading, setError, setAccountExists });
  }

  const isReady =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.password &&
    form.confirmPassword;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-headline text-gray-900">
          Complete Your Profile
        </h1>
      </div>

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

      <ErrorMessage message={error} />

      <PrimaryButton
        onClick={handleSubmit}
        loading={loading}
        disabled={!isReady}
      >
        {loading ? "Creating Account..." : "Create Account"}
      </PrimaryButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — OTP  (6 boxes with dash in middle like Figma)
// ---------------------------------------------------------------------------
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
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-headline text-gray-900 mb-5">
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
      {/* OTP boxes — split with dash. Figma spec is a fixed 64px box, but
          this screen is hard mobile-gated (member join is mobile-only) and
          has to fit down to a 360px Android/iPhone SE, where 6×64px+gaps
          (~460px) simply doesn't fit -- boxes stay flex-1 (shrink together
          to fit the real viewport) but the cap is raised to 64px so on any
          screen with room, they render at full spec size instead of
          settling for the old 48px cap. */}
      <OtpBoxes
        key={otpAttempt}
        value={digits}
        onChange={handleDigitChange}
        length={OTP_LENGTH}
        autoFocus
        renderBoxes={(boxDigits, activeIndex) => (
          <div className="flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex gap-2 flex-1 min-w-0">
              {boxDigits.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                  className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || i === activeIndex ? "border-[#1C2B8A]" : "border-[#D0D5E8]"}`}
                >
                  {d}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-xl font-light flex-shrink-0">—</span>
            <div className="flex gap-2 flex-1 min-w-0">
              {boxDigits.slice(3, 6).map((d, i) => {
                const idx = i + 3;
                return (
                  <div
                    key={idx}
                    aria-label={`Digit ${idx + 1} of ${OTP_LENGTH}`}
                    className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || idx === activeIndex ? "border-[#1C2B8A]" : "border-[#D0D5E8]"}`}
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
        {loading ? "Verifying..." : "Continue"}
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
// Step — Sign in via code. Not part of the linear CONTACT -> PHONE_OTP ->
// PROFILE -> OTP flow above -- entered directly (see Join()'s initial step
// selection) when arriving via CheckEmail.jsx's QR (?email=, no invite
// token). That person already has a full, verified account from SignUp.jsx's
// own register+OTP a moment earlier, just no client-side session yet.
// Routing them through registration again would only earn a 409 after
// they've already typed a name and password for nothing (see StepProfile's
// accountExists handling below) -- passwordless login OTP, the same
// requestLoginOtp/verifyLoginOtp SignIn.jsx already uses, signs them in
// directly instead.
// ---------------------------------------------------------------------------
function StepSignInOtp({ email, onVerified, onUseDifferentEmail }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [otpAttempt, setOtpAttempt] = useState(0);
  // StrictMode double-invokes effects in dev, which would otherwise fire two
  // real OTP sends off a single mount -- same guard shape as
  // useInviteToken/useJoinCommunityParam use for their own once-per-mount work.
  const didAutoSend = useRef(false);

  const secondsLeft = useCountdown(expirySeconds, `${email}-${resendCount}`);
  // Guarded on resendCount so this doesn't read as "expired" before the
  // very first send (expirySeconds/secondsLeft both start at 0).
  const codeExpired = resendCount > 0 && secondsLeft <= 0;

  async function sendCode() {
    setSending(true);
    setError("");
    try {
      const result = await requestLoginOtp({ email });
      const seconds = Math.max(0, Math.round((new Date(result.expiresAt) - Date.now()) / 1000));
      setExpirySeconds(seconds);
      setResendCount((c) => c + 1);
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpAttempt((a) => a + 1);
    } catch (err) {
      setError(notifyError(err, { context: "Send login code", silent: true }));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (didAutoSend.current) return;
    didAutoSend.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const result = await verifyLoginOtp({ email, token: code });
      if (result?.mfaRequired) {
        // This step's only audience is a brand-new account (see the
        // component comment above), which can't have MFA configured yet in
        // practice -- a defensive message instead of a built-out challenge
        // screen, pointing at the one place that already handles it.
        setError("This account has extra security enabled. Please use the full sign-in page to continue.");
        return;
      }
      onVerified(result);
    } catch (err) {
      setError(notifyError(err, { context: "Verify login code", fallback: "That code didn't work. Please try again.", silent: true }));
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpAttempt((a) => a + 1);
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    sendCode();
  }

  const allFilled = digits.every(Boolean);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-headline text-gray-900 mb-5">
          You Already Have An Account
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          {sending ? "Sending a sign-in code to" : "Enter the 6-digit code sent to"}
        </p>
        <p className="font-semibold text-sm text-gray-900 mb-1">{email}</p>
        <button
          onClick={onUseDifferentEmail}
          className="text-sm font-medium mt-1 text-[#1C2B8A]"
        >
          Not you?
        </button>
        {resendCount > 0 && (
          <p className={`text-xs mt-2 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {codeExpired
              ? "Your code has expired — request a new one below."
              : `Code expires in ${formatCountdown(secondsLeft)}`}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (allFilled && !codeExpired && !sending) handleVerify();
        }}
        className="flex flex-col gap-6"
      >
        <OtpBoxes
          key={otpAttempt}
          value={digits}
          onChange={handleDigitChange}
          length={OTP_LENGTH}
          autoFocus
          renderBoxes={(boxDigits, activeIndex) => (
            <div className="flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex gap-2 flex-1 min-w-0">
                {boxDigits.slice(0, 3).map((d, i) => (
                  <div
                    key={i}
                    aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                    className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || i === activeIndex ? "border-[#1C2B8A]" : "border-[#D0D5E8]"}`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <span className="text-gray-400 text-xl font-light flex-shrink-0">—</span>
              <div className="flex gap-2 flex-1 min-w-0">
                {boxDigits.slice(3, 6).map((d, i) => {
                  const idx = i + 3;
                  return (
                    <div
                      key={idx}
                      aria-label={`Digit ${idx + 1} of ${OTP_LENGTH}`}
                      className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || idx === activeIndex ? "border-[#1C2B8A]" : "border-[#D0D5E8]"}`}
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

        <PrimaryButton onClick={handleVerify} loading={loading} disabled={!allFilled || codeExpired || sending}>
          {loading ? "Verifying..." : "Continue"}
        </PrimaryButton>
      </form>

      <p className="text-sm text-center text-gray-500 pb-2">
        Didn't get a code?{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || sending}
          className="font-semibold disabled:opacity-40 text-[#1C2B8A]"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
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
  const { community, consumeCommunity } = useJoinCommunityParam();
  const joinEmail = useJoinEmailParam();
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
        .then((res) => {
          const data = res?.data?.data ?? res?.data;
          const status = (data?.status ?? "").toUpperCase();
          if (status !== "APPROVED") {
            recordPendingJoinRequest({ id: null, slug: community, name: null });
          }
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
  // Email/phone collected in StepContact, carried forward into StepProfile's
  // register() call. Seeded from joinEmail when arriving via CheckEmail.jsx's
  // QR (?email=) so scanning it doesn't drop what was already typed on
  // desktop -- useJoinEmailParam strips the param right after this first
  // read, but useState only consults its argument on mount, so the later
  // re-render (with the param gone) doesn't clobber this.
  const [contact, setContact] = useState({ email: joinEmail, phone: "" });
  const [phoneConfirmToken, setPhoneConfirmToken] = useState("");
  const [step, setStep] = useState(() => {
    if (email) return STEPS.OTP; // resuming a pending registration verification
    // Arrived via CheckEmail.jsx's QR with just an email, no personal
    // invite -- skip CONTACT/PROFILE entirely and go straight to signing
    // them in (see StepSignInOtp). A real invite token always takes the
    // normal registration path regardless, even if this combination could
    // somehow occur.
    if (joinEmail && !token) return STEPS.SIGNIN_OTP;
    return STEPS.CONTACT;
  });

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
      const res = await submitJoinRequest(community);
      const data = res?.data?.data ?? res?.data;
      const status = (data?.status ?? "").toUpperCase();
      // An open community approves instantly -- nothing to watch for in
      // that case. Otherwise, track it the same way DiscoverCommunities
      // does so Home's approval watcher can pick it up later, since this
      // link only carries a slug (no id/name yet -- the watcher fills
      // those in from the live communities list once it actually matches).
      if (status !== "APPROVED") {
        recordPendingJoinRequest({ id: null, slug: community, name: null });
      }
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
    if (token) {
      toastSuccess("You're in!", { description: "Welcome to the community." });
      navigate("/member/home", { replace: true });
      return;
    }
    // Neither a personal token nor a community slug -- this account was
    // created via the marketing site's contextless "Join A Community" CTA,
    // not a specific invite. /member/invites would just be empty; send them
    // straight to browsing instead of a dead end they'd have to find their
    // own way out of via Home's empty state.
    navigate("/member/communities/search", { replace: true });
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
    if (token) {
      navigate("/member/invites", { replace: true });
      return;
    }
    navigate("/member/communities/search", { replace: true });
  }

  function handleContactNext({ email: enteredEmail, phone }) {
    setContact({ email: enteredEmail, phone });
    // StepContact requires a phone number client-side (see its
    // validatePhone), so this step always runs today -- the empty-phone
    // fallback exists for symmetry with SignUp.jsx and in case that
    // requirement is ever relaxed to match the backend's "phone stays
    // optional" stance.
    setStep(phone ? STEPS.PHONE_OTP : STEPS.PROFILE);
  }

  function handlePhoneVerified(confirmToken) {
    setPhoneConfirmToken(confirmToken);
    setStep(STEPS.PROFILE);
  }

  // "Not you?" on StepSignInOtp -- the QR's email guess was wrong (or this
  // is someone else's device); drop back to a normal CONTACT step instead
  // of insisting they sign in as whoever CheckEmail.jsx assumed.
  function handleUseDifferentEmail() {
    setContact((c) => ({ ...c, email: "" }));
    setStep(STEPS.CONTACT);
  }

  function handleBack() {
    if (step === STEPS.OTP) {
      sessionStorage.removeItem(PENDING_KEY);
      setStep(STEPS.CONTACT);
    }
  }

  // Registration has to happen before any verification code can be sent —
  // there's no account yet to send one for. This was previously inverted
  // (collecting just an email and calling a nonexistent /api/auth/send-otp
  // before the account existed), which is why no code was ever delivered.
  async function handleProfileSubmit({
    firstName,
    lastName,
    password,
    confirmPassword,
    loading: setLoading,
    setError,
    setAccountExists,
  }) {
    try {
      const payload = {
        email: contact.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        confirmPassword,
        ...(token && { inviteToken: token }),
        // phoneConfirmToken is required whenever phoneNumber is present --
        // StepContact requires a phone client-side, so contact.phone is
        // always set here today, but this stays conditional for symmetry
        // with SignUp.jsx's genuinely-optional case.
        ...(contact.phone && { phoneNumber: contact.phone, phoneConfirmToken }),
      };
      const authData = await register(payload);
      maybeStoreSession(authData);
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email: contact.email }));
      setEmail(contact.email);
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
  // than flashing the signup form first. PageLoadingState (the app's one
  // branded full-page treatment), not the small generic LoadingState --
  // this replaces the whole viewport right after the route-level Suspense
  // fallback (LoadingScreen, also BrandedSpinner) resolves, so a plain
  // Loader2 here was a visible downgrade mid-sequence, not a lesser variant
  // of the same loading experience.
  if (authLoading || (isAuthenticated && (community || token))) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-bg">
        <PageLoadingState />
      </div>
    );
  }

  return (
    <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
      {step === STEPS.CONTACT ? (
        // StepContact renders its own top-level Fragment (content block +
        // a separately-pinned consent line) rather than sitting inside the
        // shared wrapper below -- that wrapper's mb-auto only pushes free
        // space below itself as a whole, which isn't enough to pin just the
        // consent text to the bottom the way the Figma treatment shows it.
        <StepContact
          initialEmail={contact.email}
          initialPhone={contact.phone}
          onNext={handleContactNext}
          onGoogleAuth={handleGoogleAuth}
          hasCommunity={Boolean(community)}
        />
      ) : (
        <div className="w-full max-w-md flex flex-col md:mt-14 mb-auto gap-5">
          {step === STEPS.PHONE_OTP && (
            <PhoneOTPStep
              phone={contact.phone}
              onVerified={handlePhoneVerified}
              onBack={() => setStep(STEPS.CONTACT)}
            />
          )}
          {step === STEPS.PROFILE && (
            <StepProfile onSubmit={handleProfileSubmit} />
          )}
          {step === STEPS.OTP && (
            <StepOTP email={email} onVerified={handleVerified} onBack={handleBack} />
          )}
          {step === STEPS.SIGNIN_OTP && (
            <StepSignInOtp
              email={contact.email}
              onVerified={handleVerified}
              onUseDifferentEmail={handleUseDifferentEmail}
            />
          )}
        </div>
      )}
    </AuthLayout>
  );
}
