/**
 * ChoosePath.jsx — no API calls, pure navigation
 * Receives email from router state (set by SignUp's OTP step)
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Info } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import CreateCommunityIcon from "../../assets/auth/create-community.webp";
import JoinCommunityIcon from "../../assets/auth/join-community.webp";
import StepIndicator from "../../components/onboarding/StepIndicator";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";

export default function ChoosePath() {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email ?? "";
  const [selected, setSelected] = useState("create");

  const options = [
    { id: "create", title: "Create Community",
      description: "No existing members or records. Start building your community on Glass.",
      icon: CreateCommunityIcon },
    { id: "join",   title: "Join Community",
      description: "Your community already exists. Join Now.",
      icon: JoinCommunityIcon },
  ];

  const handleContinue = () => {
    if (selected === "create") {
      navigate("/onboarding/paying-member", { state: { email } });
    } else {
      navigate("/check-email", { state: { email } });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-contain bg-center lg:bg-page-default">
      {/* Mobile-only backdrop — same two-layer background + ambient logo
          glow the member app uses everywhere (AuthLayout, MemberAppLayout,
          GlassLogoGlow). Desktop keeps bg-page-default via the class above. */}
      <div className="absolute inset-0 lg:hidden -z-10 bg-cover bg-center bg-no-repeat bg-mobile-auth-default" />
      <GlassLogoGlow className="lg:hidden" />

      <header className="relative flex items-center px-6 lg:px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-bold text-gray-900 text-base">Glass</span>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center px-6 lg:px-8 pb-10">
        <StepIndicator stepId="choose-path" />
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">What would you like to do?</h1>
          <p className="text-sm text-gray-500">Are you setting up a community, or joining one you've been invited to?</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 mb-8 w-full max-w-[500px] lg:max-w-none items-stretch">
          {options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`relative flex flex-row lg:flex-col items-center text-left lg:text-center gap-4 lg:gap-0 px-5 lg:px-10 py-5 lg:py-8 rounded-2xl transition-all duration-200 cursor-pointer w-full lg:w-[380px] border-2 ${isSelected ? "border-brand bg-white" : "border-[#E5E5E5] bg-[#FAFAFA]"}`}
              >
                <div className="absolute top-4 left-4 lg:left-4">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-brand">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[#C2C2C2]" />
                  )}
                </div>
                <div className="flex-shrink-0 mt-0 ml-9 lg:ml-0 lg:mt-6 lg:mb-5">
                  <img src={option.icon} alt={option.title} className="w-10 h-10 lg:w-14 lg:h-14 object-contain mx-auto" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1 lg:mb-2">{option.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-1.5 mb-6 w-full max-w-[500px]">
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-snug text-left">
            This choice isn't final — whichever option you pick now, you can still create or join additional communities later from your dashboard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-[500px]">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-3xl text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer bg-brand"
          >
            Continue
          </button>
          <button
            onClick={() => navigate("/dashboard/home")}
            className="text-sm font-medium hover:underline bg-transparent border-none cursor-pointer text-brand"
          >
            Skip
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </main>
    </div>
  );
}
