import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUpdateProfile } from "../../hooks/useMyAccount";
import { useAuth } from "../../store/AuthContext";
import { getErrorMessage } from "../../utils/errorHandler";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";

// Fills in what Google's OAuth flow never gave us — it only proves email
// ownership, never a name or phone number, both of which the rest of Glass
// (member lists, WhatsApp updates) assumes every account has. Reached from
// SignIn.jsx's Google auth handler via either /complete-profile or
// /member/complete-profile, both rendering this same component (see
// SignIn.jsx for why these were merged); `location.state.next` carries
// where to continue once this is filled in.
export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [error, setError] = useState("");

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  async function handleSubmit() {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phone.trim(),
      });
      await refreshUser();
      const fallback = user?.isAdmin ? "/dashboard/home" : "/member/home";
      navigate(location.state?.next ?? fallback, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save your details."));
    }
  }

  const isReady = form.firstName.trim() && form.lastName.trim() && form.phone.trim();

  return (
    <AuthLayout heroTitle="Community Finance" heroSubtitle="Crystal Clear">
      <div className="w-full max-w-sm flex flex-col my-auto gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Complete Your Profile</h1>
          <p className="text-sm text-gray-500">
            Google didn't share these with us — just need them to set up your account.
          </p>
        </div>

        <div>
          <Label htmlFor="firstName">First Name</Label>
          <TextInput
            id="firstName"
            placeholder="Enter Your Name"
            value={form.firstName}
            onChange={set("firstName")}
            autoComplete="given-name"
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <TextInput
            id="lastName"
            placeholder="Enter Last Name"
            value={form.lastName}
            onChange={set("lastName")}
            autoComplete="family-name"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <TextInput
            id="phone"
            type="tel"
            placeholder="e.g. 0803 123 4567"
            value={form.phone}
            onChange={set("phone")}
            autoComplete="tel"
            inputMode="tel"
          />
          <ErrorMessage message={error} />
        </div>

        <PrimaryButton onClick={handleSubmit} loading={updateProfile.isPending} disabled={!isReady}>
          {updateProfile.isPending ? "Saving…" : "Continue"}
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}
