import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import RegisterStep from "./RegisterStep";
import OTPStep from "./OTPStep";

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
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      {step === 1 && <RegisterStep onNext={handleRegistered} />}
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
