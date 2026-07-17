import { useState } from "react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import EmailPhoneStep from "./EmailPhoneStep";
import RegisterStep from "./RegisterStep";
import OTPStep from "./OTPStep";
import { useAuth } from "../../../store/AuthContext";

// ── Main Component ────────────────────────────────────────────────────────────
export default function SignUp() {
  usePageTitle("Create your account");
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Some backends issue a session immediately on register, others only
  // after email verification — store it the moment either response
  // actually includes a token, instead of assuming which step does it.
  const maybeStoreSession = (authData) => {
    if (authData?.accessToken) setSession(authData);
  };

  const handleEmailPhone = ({ email: submittedEmail, phone: submittedPhone }) => {
    setEmail(submittedEmail);
    setPhone(submittedPhone);
    setStep(2);
  };

  const handleRegistered = (registeredEmail, authData) => {
    maybeStoreSession(authData);
    setEmail(registeredEmail);
    setStep(3);
  };

  const handleVerified = (authData) => {
    maybeStoreSession(authData);
    navigate("/onboarding/choose-path", { state: { email } });
  };

  // Google already proves the user owns this email, so there's no OTP step
  // to go through — skip straight to onboarding.
  const handleGoogleAuth = (user) => {
    navigate("/onboarding/choose-path", { state: { email: user?.email ?? email } });
  };

  return (
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      {step === 1 && (
        <EmailPhoneStep
          initialEmail={email}
          initialPhone={phone}
          onNext={handleEmailPhone}
          onSwitch={() => navigate("/sign-in")}
          onGoogleAuth={handleGoogleAuth}
        />
      )}
      {step === 2 && (
        <RegisterStep
          email={email}
          phone={phone}
          onNext={handleRegistered}
        />
      )}
      {step === 3 && (
        <OTPStep
          email={email}
          onVerified={handleVerified}
          onBack={() => setStep(1)}
        />
      )}
    </AuthLayout>
  );
}
