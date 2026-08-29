import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useInviteToken } from "../../../../hooks/useInviteToken";
import { getEmailError } from "../../../../utils/validators";
import GoogleAuthButton from "../../../../components/auth/GoogleAuthButton";
import { Button as PrimaryButton } from "../../../../components/ui/Button";
import { TextInput } from "../../../../components/ui/TextInput";
import { Label, ErrorMessage } from "./shared";

// ---------------------------------------------------------------------------
// Step 1 — Contact (email only) — no API call here, just like SignUp's
// EmailPhoneStep; the field is handed up to Join()'s local state and
// combined with StepProfile's fields into one register() call once step 2
// completes, since the backend only sends a verification code after the
// account actually exists. Phone is no longer collected here -- it's
// optional at registration (Meta/WhatsApp verification isn't fully wired up
// backend-side yet) and is instead added later via Settings/Profile's
// "Verify Your Phone Number" flow. Join()'s STEPS.PHONE_OTP branch and
// register() payload already treat an empty phone as the normal case.
// ---------------------------------------------------------------------------
export default function StepContact({ initialEmail, onNext, onGoogleAuth, hasCommunity }) {
  const { hasToken } = useInviteToken();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "" });
  const [error, setError] = useState("");

  function handleFieldChange(setValue) {
    return (e) => {
      const value = e.target.value;
      setValue(value);
      setError("");
      setFieldErrors((fe) => (fe.email ? { ...fe, email: getEmailError(value) } : fe));
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
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }
    setError("");
    onNext({ email: trimmedEmail, phone: "" });
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
          onChange={handleFieldChange(setEmail)}
          autoComplete="email"
          inputMode="email"
        />
        <ErrorMessage message={fieldErrors.email} />
      </div>

      <label className="flex items-start gap-2 cursor-pointer select-none">
        {/* appearance-none takes over rendering entirely -- the browser's
            native checkbox is filled white by the OS/browser UA style
            regardless of our own bg classes, which is why removing
            bg-white alone never changed anything. Checkmark is drawn by
            hand since appearance-none also kills the native tick. */}
        <span className="relative mt-0.5 w-4 h-4 flex-shrink-0">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
            className="appearance-none w-4 h-4 rounded-sm border border-[#797D86]/40 checked:bg-[#1C2B8A] checked:border-[#1C2B8A] cursor-pointer"
          />
          {agreed && (
            <Check size={12} strokeWidth={3} className="absolute inset-0 m-auto text-white pointer-events-none" />
          )}
        </span>
        <span className="text-xs md:text-sm text-gray-700">
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

      <PrimaryButton onClick={handleSubmit} disabled={!email.trim()} size="sm">
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
