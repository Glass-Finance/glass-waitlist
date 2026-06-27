import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUpdateProfile } from "../../../hooks/useMyAccount";
import { useAuth } from "../../../store/AuthContext";
import { getErrorMessage } from "../../../utils/errorHandler";
import AuthLayout from "../../../layouts/AuthLayout";

// ── Shared styles (matches SignIn/SignUp) ─────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
const inputStyle = { border: "1.5px solid #C2C2C2" };
const onFocus = (e) => (e.target.style.borderColor = "#2535c3");
const onBlur = (e) => (e.target.style.borderColor = "#C2C2C2");

const PrimaryBtn = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    style={{ background: "#2535c3" }}
  >
    {children}
  </button>
);

// ── Fills in what Google's OAuth flow never gave us — it only proves email
// ownership, never a name or phone number, both of which the rest of Glass
// (member lists, WhatsApp updates) assumes every account has. ──────────────
export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await updateProfile.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phone.trim(),
      });
      await refreshUser();
      navigate(location.state?.next ?? "/onboarding/choose-path", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save your details."));
    }
  };

  return (
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      <div className="w-full max-w-sm flex flex-col my-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            Complete Your Profile
          </h1>
          <p className="text-sm text-gray-500">
            Google didn't share these with us — just need them to set up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">First Name</label>
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
              <label className="text-sm font-medium text-gray-700">Last Name</label>
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
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
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
          </div>

          {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

          <PrimaryBtn loading={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Continue"}
          </PrimaryBtn>
        </form>
      </div>
    </AuthLayout>
  );
}
