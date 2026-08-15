import { useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../utils/phone";
import { getEmailError } from "../../../utils/validators";
import { requestPhoneOtp } from "../../../services/authService";
import { getErrorMessage } from "../../../utils/errorHandler";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";
import { SignUpTextInput, SignUpFieldError } from "./SignUpTextInput";
import { Button as PrimaryBtn } from "../../../components/ui/Button";

const Divider = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-gray-300" />
    <span className="text-xs text-gray-400">or</span>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
);

// ── Step 1: Email + Phone ──────────────────────────────────────────────────────
// No API call here -- email/phone are just handed up to SignUp/index.jsx's
// local state and combined with CompleteProfileStep's fields into the same
// single register() call the old one-screen form used to make.
function validatePhone(value) {
  if (!value.trim()) return "Phone number is required.";
  if (!isPhoneValid(value)) return PHONE_FORMAT_HINT;
  return "";
}

export default function EmailPhoneStep({ initialEmail, initialPhone, onNext, onSwitch, onGoogleAuth }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFieldChange(field, setValue) {
    return (e) => {
      const value = e.target.value;
      setValue(value);
      const validate = field === "email" ? getEmailError : validatePhone;
      setFieldErrors((fe) => (fe[field] ? { ...fe, [field]: validate(value) } : fe));
    };
  }

  // Sends the phone OTP right here (instead of waiting for PhoneOTPStep to
  // do it on mount) so a duplicate/rejected phone number is caught and
  // shown inline on this form -- the user should never land on an OTP
  // screen only to find out the number they entered can't be used.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    const emailError = getEmailError(email);
    const phoneError = validatePhone(phone);
    if (emailError || phoneError) {
      setFieldErrors({ email: emailError, phone: phoneError });
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    setSubmitting(true);
    try {
      await requestPhoneOtp({ phoneNumber: trimmedPhone });
      onNext({ email: trimmedEmail, phone: trimmedPhone });
    } catch (err) {
      setFieldErrors((fe) => ({
        ...fe,
        phone: getErrorMessage(err, "Couldn't send a code to that number. Please try again."),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col md:mt-14 mb-auto">
      <div className="mb-3">
        <h1 className="text-headline text-gray-900 mb-1.5">
          Create Your Account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Email Address
          </label>
          <SignUpTextInput
            type="email"
            value={email}
            onChange={handleFieldChange("email", setEmail)}
            placeholder="e.g Bax**re@gmail.com"
            required
            error={fieldErrors.email}
          />
          <SignUpFieldError message={fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Phone Number
          </label>
          <SignUpTextInput
            type="tel"
            value={phone}
            onChange={handleFieldChange("phone", setPhone)}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            placeholder="e.g. 0803 123 4567"
            required
            error={fieldErrors.phone}
          />
          <SignUpFieldError message={fieldErrors.phone} />
          {phoneFocused && (
            <div className="flex items-start gap-1.5 mt-0.5 px-0.5">
              <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-snug">
                We'll send updates to this number.
              </p>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none -mt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded flex-shrink-0 cursor-pointer bg-white border border-gray-300 accent-[#2535c3]"
          />
          <span className="text-xs text-gray-500 leading-snug">
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline text-brand"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline text-brand"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

        <PrimaryBtn type="submit" className="mt-2 !py-3.5" disabled={!email.trim() || !phone.trim() || !agreed} loading={submitting} size="sm">
          {submitting ? "Sending Code..." : "Continue"}
        </PrimaryBtn>
      </form>

      <Divider />
      <div
        className={!agreed ? "opacity-50 pointer-events-none" : ""}
        title={!agreed ? "Agree to the Terms of Service and Privacy Policy first" : undefined}
      >
        <GoogleAuthButton onAuthenticated={onGoogleAuth} label="signup_with" />
      </div>

      <p className="text-center text-sm mt-5 text-gray-500">
        Already Have An Account?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer text-brand"
        >
          Sign In
        </button>
      </p>
    </div>
  );
}
