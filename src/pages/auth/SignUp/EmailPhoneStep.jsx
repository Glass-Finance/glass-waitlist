import { useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../utils/phone";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-placeholder outline-none transition-all";
const inputStyle = { border: "1.5px solid #C2C2C2" };
const onFocus = (e) => (e.target.style.borderColor = "#2535c3");
const onBlur = (e) => (e.target.style.borderColor = "#C2C2C2");

const PrimaryBtn = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-button transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    style={{ background: "#2535c3" }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400">or</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ── Step 1: Email + Phone ──────────────────────────────────────────────────────
// No API call here -- email/phone are just handed up to SignUp/index.jsx's
// local state and combined with CompleteProfileStep's fields into the same
// single register() call the old one-screen form used to make.
export default function EmailPhoneStep({ initialEmail, initialPhone, onNext, onSwitch, onGoogleAuth }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!isPhoneValid(phone)) {
      setError(PHONE_FORMAT_HINT);
      return;
    }
    onNext({ email: trimmedEmail, phone: phone.trim() });
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="mb-3">
        <h1 className="text-headline text-gray-900 mb-1.5">
          Create Your Account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g Bax**re@gmail.com"
            required
            className={inputCls}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            WhatsApp Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0803 123 4567"
            required
            className={inputCls}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <div className="flex items-start gap-1.5 mt-0.5 px-0.5">
            <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-snug">
              We'll send updates to your WhatsApp.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none -mt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded flex-shrink-0 cursor-pointer"
            style={{ accentColor: "#2535c3" }}
          />
          <span className="text-xs text-gray-500 leading-snug">
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline"
              style={{ color: "#002FA7" }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline"
              style={{ color: "#002FA7" }}
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

        <PrimaryBtn disabled={!agreed}>Continue</PrimaryBtn>
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
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer"
          style={{ color: "#002FA7" }}
        >
          Sign In
        </button>
      </p>
    </div>
  );
}
