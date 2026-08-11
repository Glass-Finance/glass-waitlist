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
import { isMobileDevice, mobileRequiredPath } from "../../utils/deviceRedirect";
import { useAuth } from "../../store/AuthContext";

export default function ChoosePath() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const email    = location.state?.email ?? "";
  // Entry points that specifically mean "join" (e.g. Communities Home's
  // Join Community button) pass this so the option isn't stuck defaulting
  // to Create -- see CommunitiesHome.jsx.
  const [selected, setSelected] = useState(location.state?.intent === "join" ? "join" : "create");

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
    } else if (isAuthenticated) {
      // Join.jsx (below) is a full account-registration form -- fine for a
      // brand-new visitor, but an already-authenticated user (e.g. an admin
      // clicking Join Community from Communities Home, or someone who just
      // finished SignUp's own registration+OTP a moment ago) already has a
      // real account. Routing them through registration again just gets a
      // 409 "you already have an account" and dead-ends at sign-in instead
      // of actually joining anything. Take them straight to browsing
      // communities to request to join with the account they already have.
      const target = "/member/communities/search";
      navigate(isMobileDevice() ? target : mobileRequiredPath(target));
    } else if (isMobileDevice()) {
      // /check-email below is a desktop-only handoff (QR + "open the link
      // on your phone") for reaching /member/join, which is itself gated
      // to mobile only. Already being on mobile means that detour has
      // nothing left to hand off to -- go straight to the real join flow,
      // same as MembersHero.jsx/MembersCTA.jsx's isMobileDevice() check.
      navigate("/member/join");
    } else {
      navigate("/check-email", { state: { email } });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-contain bg-center lg:bg-page-default">
      {/* Mobile-only backdrop, matching AuthLayout's single-layer background --
          no GlassLogoGlow stacked on top here: both it and this background
          anchor their glow to the same bottom-left corner, and stacking them
          compounded into a much more saturated blue than every other mobile
          screen (auth pages, Communities Home) shows. */}
      <div className="fixed inset-0 lg:hidden -z-10 bg-cover bg-center bg-no-repeat bg-mobile-auth-default" />

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

        <div className="flex flex-col lg:flex-row lg:justify-center gap-3 lg:gap-5 mb-8 w-full max-w-[500px] lg:max-w-none items-stretch">
          {options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`relative flex flex-row lg:flex-col items-center text-left lg:text-center gap-4 lg:gap-0 px-5 lg:px-10 py-5 lg:py-8 rounded-2xl transition-all duration-200 cursor-pointer w-full lg:w-[380px] border-2 bg-white ${isSelected ? "border-brand" : "border-[#E5E5E5]"}`}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#EEF2FF] lg:bg-transparent lg:rounded-none lg:w-14 lg:h-14 lg:mt-6 lg:mb-5">
                  <img src={option.icon} alt={option.title} className="w-6 h-6 lg:w-14 lg:h-14 object-contain" />
                </div>
                <div className="flex-1 min-w-0 lg:flex-none">
                  <h3 className="font-semibold text-gray-900 text-base mb-1 lg:mb-2">{option.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
                </div>
                <div className="flex-shrink-0 lg:absolute lg:top-4 lg:left-4">
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
