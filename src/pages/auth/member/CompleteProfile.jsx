import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUpdateProfile } from "../../../hooks/useMyAccount";
import { useAuth } from "../../../store/AuthContext";
import { getErrorMessage } from "../../../utils/errorHandler";

// ── Import your actual assets ──────────────────────────────────────────────
import glassLogo from "../../../assets/cta/ctalogo.png";
import authHeroBg from "../../../assets/auth/mobile-auth.png";

// ---------------------------------------------------------------------------
// Primitives (same light-sheet style as SignIn/Join)
// ---------------------------------------------------------------------------
function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium mb-1.5"
      style={{ color: "#111" }}
    >
      {children}
    </label>
  );
}

function TextInput({ id, type = "text", placeholder, value, onChange, autoComplete, inputMode }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      inputMode={inputMode}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white"
      style={{ border: focused ? "1.5px solid #1C2B8A" : "1.5px solid #E0E0E6" }}
    />
  );
}

function PrimaryButton({ children, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-full py-4 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
      style={{ background: disabled || loading ? "#B0B8D8" : "#1C2B8A" }}
    >
      {loading ? "Saving…" : children}
    </button>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1.5 px-1" style={{ color: "#E53E3E" }} role="alert">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Shell — same two-tone layout as SignIn/Join
// ---------------------------------------------------------------------------
function MobileShell({ children }) {
  return (
    <div className="flex justify-center items-start min-h-screen bg-[#EFEFEF]">
      <div
        className="relative w-full max-w-[430px] min-h-screen overflow-hidden flex flex-col"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="relative flex-shrink-0" style={{ height: "45vh", minHeight: 220, borderRadius: 0 }}>
          <img src={authHeroBg} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(28,43,138,0.55) 0%, rgba(90,10,90,0.45) 100%)" }}
          />
          <img src={glassLogo} alt="Glass" className="absolute top-10 left-5 h-9 w-auto object-contain" draggable={false} />
          <p
            className="absolute bottom-10 left-0 right-0 text-center text-white font-medium leading-snug px-8 pb-10"
            style={{ fontSize: "clamp(24px,4vw,22px)" }}
          >
            One Last Step
          </p>
        </div>

        <div
          className="flex-1 flex flex-col px-6 pt-8 pb-safe z-30"
          style={{ background: "#EFEFEF", borderRadius: "24px 24px 0 0", marginTop: -28, overflowY: "auto" }}
        >
          {children}
          <div style={{ height: "env(safe-area-inset-bottom, 20px)" }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fills in what Google's OAuth flow never gave us — it only proves email
// ownership, never a name or phone number, both of which the rest of Glass
// (member lists, WhatsApp updates) assumes every account has. ──────────────
// ---------------------------------------------------------------------------
export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
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
      navigate(location.state?.next ?? "/member/home", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save your details."));
    }
  }

  const isReady = form.firstName.trim() && form.lastName.trim() && form.phone.trim();

  return (
    <MobileShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Complete Your Profile</h1>
          <p className="text-sm text-gray-500">
            Google didn't share these with us — just need them to set up your account.
          </p>
        </div>

        <div>
          <Label htmlFor="firstName">First Name</Label>
          <TextInput id="firstName" placeholder="Enter Your Name" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <TextInput id="lastName" placeholder="Enter Last Name" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <TextInput id="phone" type="tel" placeholder="e.g. 0803 123 4567" value={form.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" />
          <ErrorMessage message={error} />
        </div>

        <PrimaryButton onClick={handleSubmit} loading={updateProfile.isPending} disabled={!isReady}>
          Continue
        </PrimaryButton>
      </div>
    </MobileShell>
  );
}
