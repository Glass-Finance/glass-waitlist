import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthPanel from "../../assets/auth/auth-panel.png";
import { useAuth } from "../../store/AuthContext";
import {
  register,
  verifyEmail,
  resendVerification,
  storeAuthSession,
} from "../../services/authService";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
const inputStyle = { border: "1.5px solid #C2C2C2" };
const onFocus = (e) => (e.target.style.borderColor = "#002FA7");
const onBlur  = (e) => (e.target.style.borderColor = "#C2C2C2");
 
// ── Shared sub-components ─────────────────────────────────────────────────────
function PrimaryBtn({ children, loading, onClick, type = "submit" }) {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 border-none cursor-pointer"
      style={{ background: "#2535c3" }}
    >
      {children}
    </button>
  );
}
 
function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
 
function GoogleBtn() {
  return (
    <button
      type="button"
      className="w-full py-3.5 rounded-3xl bg-white font-medium text-sm text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer"
      style={{ border: "1.5px solid #C2C2C2" }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Sign Up With Google
    </button>
  );
}

// ── Step 1: Register (Email + Name + Password) ────────────────────────────────
function RegisterStep({ onNext, onSwitch }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      onNext(form.email);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
          Create Your Account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
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
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Enter Your Name"
              required
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
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
          <label className="text-sm font-medium text-gray-700">
            Create Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
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
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
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

        {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

        <PrimaryBtn loading={loading}>
          {loading ? "Creating Account..." : "Continue"}
        </PrimaryBtn>
      </form>

      <Divider />
      <GoogleBtn />

      <p className="text-center text-sm mt-5 text-gray-500">
        Already Have An Account?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer"
          style={{ color: "#1B2FE8" }}
        >
          Sign In
        </button>
      </p>
    </div>
  );
}

// ── Step 2: OTP Verification ───────────────────────────────────────────────────
function OTPStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyEmail({ email, token: otp.join("") });
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }}
 
  

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      await resendVerification({ email });
      setResendMessage("A new code has been sent.");
    } catch {
      setResendMessage("Could not resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-sans)" }}>
          Verification Code Sent
        </h1>
        <p className="text-sm text-gray-500 mb-0.5">Enter the 6-digit code that was sent to</p>
        <p className="text-sm font-semibold text-gray-900">{email}</p>
        <button onClick={onBack} className="text-sm font-medium mt-1 hover:underline" style={{ color: "#1B2FE8" }}>
          Wrong email?
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex items-center gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <input key={i} ref={(el) => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={otp[i]} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all" style={{ border: "1.5px solid #C2C2C2" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")} onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")} />
          ))}
          <span className="text-gray-400 text-lg font-medium px-1">—</span>
          {[3, 4, 5].map((i) => (
            <input key={i} ref={(el) => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={otp[i]} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all" style={{ border: "1.5px solid #C2C2C2" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")} onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")} />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 text-center -mt-2">{error}</p>}

        <button type="submit" disabled={loading || otp.some((d) => !d)} className="w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ background: "#2535c3" }}>
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: "var(--color-gray-text)" }}>
        Didn't get OTP?{" "}
        <button onClick={handleResend} disabled={resending} className="font-semibold hover:underline disabled:opacity-60" style={{ color: "#1B2FE8" }}>
          {resending ? "Resending..." : "Resend"}
        </button>
      </p>
      {resendMessage && <p className="text-center text-xs text-gray-400 mt-1">{resendMessage}</p>}
    </div>
  );
 };

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemberAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  const handleRegistered = (registeredEmail) => {
    setEmail(registeredEmail);
    setStep(2);
  };

  const handleVerified = () => {
    navigate("/onboarding/choose-path", { state: { email } });
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F6] p-2">
      {/* LEFT panel */}
      <div className="hidden md:block w-[46%] h-full flex-shrink-0 rounded-3xl overflow-hidden">
        <img src={AuthPanel} alt="Glass Finance" className="w-full h-full object-cover" />
      </div>

      {/* RIGHT form */}
      <div className="flex-1 flex flex-col justify-center items-center px-12 bg-[#F5F5F6] overflow-y-auto">
        {step === 1 && <RegisterStep onNext={handleRegistered} />}
        {step === 2 && (
          <OTPStep
            email={email}
            onVerified={handleVerified}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}