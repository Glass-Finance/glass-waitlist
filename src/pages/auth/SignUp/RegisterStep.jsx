import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Info } from "lucide-react";
import { register } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../utils/password";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../utils/phone";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";
import PasswordChecklist from "../../../components/auth/PasswordChecklist";

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

// ── Step 1: Register (Email + Name + Password) ────────────────────────────────
export default function RegisterStep({ onNext, onSwitch, onGoogleAuth }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    try {
      const result = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: trimmedEmail,
        phoneNumber: form.phone.trim(),
        password: form.password,
      });
      onNext(trimmedEmail, result);
    } catch (err) {
      setError(notifyError(err, { context: "Register" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="mb-3">
        <h1 className="text-headline text-gray-900 mb-1.5">
          Create Your Account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-label font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Enter Your Name"
              required
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Enter Last Name"
              required
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
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
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
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
              This number should be linked to an active WhatsApp account — we'll use it to send you updates.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Create Password
          </label>
          <div className="relative">
            <input
              key={showPassword ? "text" : "password"}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter Your Password"
              required
              className={`${inputCls} pr-11`}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordChecklist password={form.password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter Password"
              required
              className={`${inputCls} pr-11`}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
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

        <PrimaryBtn loading={loading} disabled={!agreed}>
          {loading ? "Creating Account..." : "Continue"}
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
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer"
          style={{ color: "#002FA7" }}
        >
          Sign In
        </button>
      </p>
    </div>
  );
}
