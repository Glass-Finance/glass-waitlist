import { useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { useInviteToken } from "../../../../hooks/useInviteToken";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../../utils/phone";
import { getEmailError } from "../../../../utils/validators";
import GoogleAuthButton from "../../../../components/auth/GoogleAuthButton";
import { Button as PrimaryButton } from "../../../../components/ui/Button";
import { TextInput } from "../../../../components/ui/TextInput";
import { Label, ErrorMessage } from "./shared";

// ---------------------------------------------------------------------------
// Step 1 — Contact (email + phone number) — no API call here, just like
// SignUp's EmailPhoneStep; the fields are handed up to Join()'s local state
// and combined with StepProfile's fields into one register() call once step
// 2 completes, since the backend only sends a verification code after the
// account actually exists.
// ---------------------------------------------------------------------------
export default function StepContact({ initialEmail, initialPhone, onNext, onGoogleAuth, hasCommunity }) {
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
