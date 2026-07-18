import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { register } from "../../../services/authService";
import { notifyError } from "../../../utils/errorHandler";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../utils/password";
import PasswordChecklist from "../../../components/auth/PasswordChecklist";
import { SignUpTextInput, SignUpFieldError } from "./SignUpTextInput";

const PrimaryBtn = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-button transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 bg-[#2535c3]"
  >
    {children}
  </button>
);

// ── Step 2: Complete Profile (Name + Password) ────────────────────────────────
// Fires the single register() call with email/phone carried over from
// EmailPhoneStep plus the fields collected here -- same payload shape and
// same one-call-only backend contract the old single-screen form used.
function validateField(field, value, otherValue) {
  if (field === "firstName" && !value.trim()) return "First name is required.";
  if (field === "lastName" && !value.trim()) return "Last name is required.";
  if (field === "password" && !isPasswordValid(value)) {
    return `Must include: ${PASSWORD_REQUIREMENTS_TEXT.toLowerCase()}`;
  }
  if (field === "confirmPassword") {
    if (!value) return "Please confirm your password.";
    if (value !== otherValue) return "Passwords don't match.";
  }
  return "";
}

export default function RegisterStep({ email, phone, onNext }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "", lastName: "", password: "", confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => {
      const next = { ...fe };
      if (fe[name]) next[name] = validateField(name, value, name === "password" ? form.confirmPassword : form.password);
      // Editing password after confirmPassword was already checked needs
      // confirmPassword re-checked against the fresh value.
      if (name === "password" && fe.confirmPassword) next.confirmPassword = validateField("confirmPassword", form.confirmPassword, value);
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldErrors((fe) => ({
      ...fe,
      [name]: validateField(name, value, name === "password" ? form.confirmPassword : form.password),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const nextErrors = {
      firstName: validateField("firstName", form.firstName),
      lastName: validateField("lastName", form.lastName),
      password: validateField("password", form.password),
      confirmPassword: validateField("confirmPassword", form.confirmPassword, form.password),
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors);
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email,
        phoneNumber: phone,
        password: form.password,
      });
      onNext(email, result);
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
          Complete Your Profile
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-label font-medium text-gray-700">
              First Name
            </label>
            <SignUpTextInput
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter Your Name"
              required
              error={fieldErrors.firstName}
            />
            <SignUpFieldError message={fieldErrors.firstName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label font-medium text-gray-700">
              Last Name
            </label>
            <SignUpTextInput
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter Your Name"
              required
              error={fieldErrors.lastName}
            />
            <SignUpFieldError message={fieldErrors.lastName} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label font-medium text-gray-700">
            Create Password
          </label>
          <div className="relative">
            <SignUpTextInput
              key={showPassword ? "text" : "password"}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter Your Password"
              required
              error={fieldErrors.password}
              className="pr-11"
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
            <SignUpTextInput
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="re-enter Password"
              required
              error={fieldErrors.confirmPassword}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <SignUpFieldError message={fieldErrors.confirmPassword} />
        </div>

        {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

        <PrimaryBtn loading={loading}>
          {loading ? "Creating Account..." : "Create Your Account"}
        </PrimaryBtn>
      </form>
    </div>
  );
}
