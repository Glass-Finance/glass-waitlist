import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../../utils/password";
import PasswordChecklist from "../../../../components/auth/PasswordChecklist";
import { Button as PrimaryButton } from "../../../../components/ui/Button";
import { TextInput } from "../../../../components/ui/TextInput";
import { Label, ErrorMessage } from "./shared";

// ---------------------------------------------------------------------------
// Step 2 — Profile (name + password) — email/phone already collected in
// StepContact; register() fires here with all of it combined, since the
// backend only issues a verification code once the account actually exists.
// ---------------------------------------------------------------------------
export default function StepProfile({ onSubmit }) {
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
