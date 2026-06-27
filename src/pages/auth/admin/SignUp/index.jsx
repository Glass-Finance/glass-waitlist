import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../../layouts/AuthLayout";
import RegisterStep from "./RegisterStep";
import OTPStep from "./OTPStep";
import { useAuth } from "../../../../store/AuthContext";

// ── Main Component ────────────────────────────────────────────────────────────
export default function SignUp() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  // Some backends issue a session immediately on register, others only
  // after email verification — store it the moment either response
  // actually includes a token, instead of assuming which step does it.
  const maybeStoreSession = (authData) => {
    if (authData?.accessToken) setSession(authData);
  };

  const handleRegistered = (registeredEmail, authData) => {
    maybeStoreSession(authData);
    setEmail(registeredEmail);
    setStep(2);
  };

  const handleVerified = (authData) => {
    maybeStoreSession(authData);
    navigate("/onboarding/choose-path", { state: { email } });
  };

  // Google already proves the user owns this email, so there's no OTP step
  // to go through — skip straight to onboarding. Google never gives us a
  // name though, so a brand-new account routes through one extra step to
  // collect what onboarding/the rest of Glass assumes every account has.
  const handleGoogleAuth = (user, { profileComplete } = {}) => {
    const next = "/onboarding/choose-path";
    if (!profileComplete) {
      navigate("/complete-profile", { state: { next, email: user?.email ?? email } });
      return;
    }
    navigate(next, { state: { email: user?.email ?? email } });
  };

  return (
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      {step === 1 && (
        <RegisterStep
          onNext={handleRegistered}
          onSwitch={() => navigate("/sign-in")}
          onGoogleAuth={handleGoogleAuth}
        />
      )}
      {step === 2 && (
        <OTPStep
          email={email}
          onVerified={handleVerified}
          onBack={() => setStep(1)}
        />
      )}
    </AuthLayout>
  );
}
