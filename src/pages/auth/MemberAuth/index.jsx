import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthPanel from "../../../assets/auth/auth-panel.png";
import glassLogo from "../../../assets/cta/ctalogo.png";
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
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F6] p-2">
      {/* Left panel */}
      <div className="hidden md:block w-[46%] h-full flex-shrink-0">
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          {/* Background image */}
          <img
            src={AuthPanel}
            alt="Glass Finance"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Logo */}
          <div className="absolute top-8 left-8 z-10">
            <img
              src={glassLogo}
              alt="Glass Logo"
              className="h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center z-10 px-8">
            <div className="text-center">
              <h1
                className="text-white font-normal leading-tight"
                style={{
                  fontSize: "clamp(2rem, 3vw, 2rem)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Manage Your Community
              </h1>

              <h2
                className="text-white font-normal leading-tight mt-2"
                style={{
                  fontSize: "clamp(2rem, 3vw, 2rem)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Finance Effortlessly
              </h2>
            </div>
          </div>
        </div>
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
