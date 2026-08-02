/**
 * PayingMember.jsx — pure UI, no API.
 * Passes isPaying flag to OrganizationProfile via router state.
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import PayingMemberIcon from "../../assets/auth/paying-dues.webp";
import ExemptPaymentIcon from "../../assets/auth/exempt-payments.webp";
import StepIndicator from "../../components/onboarding/StepIndicator";
import { useAuth } from "../../store/AuthContext";

export default function PayingMember() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const email    = location.state?.email;
  const [selected, setSelected] = useState("yes");

  const options = [
    { id: "yes", label: "Yes, I Will pay dues",          icon: PayingMemberIcon    },
    { id: "no",  label: "No, I'm exempt from payments",  icon: ExemptPaymentIcon   },
  ];

  const go = (skip = false) =>
    navigate("/onboarding/organization-profile", {
      state: { email, isPaying: skip ? false : selected === "yes" },
    });

  // Same escape hatch as OrganizationProfile.jsx's handleBack: an
  // already-authenticated user (an existing admin creating another
  // community, or one who lands here by accident -- stale bookmark,
  // browser back/forward) goes straight to their dashboard instead of
  // stepping back into the middle of onboarding. This page previously had
  // no way back at all, not even to the previous step.
  const handleBack = () => {
    navigate(isAuthenticated ? "/dashboard/home" : "/onboarding/choose-path", { state: { email } });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 py-14 lg:py-0 bg-contain bg-center lg:bg-page-default">
      <div className="absolute inset-0 lg:hidden -z-10 bg-cover bg-center bg-no-repeat bg-mobile-auth-default" />

      <div className="absolute top-5 left-6 lg:left-8 flex items-center gap-2">
        <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
        <span className="font-semibold text-gray-900">Glass</span>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center">
        <button
          type="button"
          onClick={handleBack}
          className="self-start flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer mb-4 -ml-1 p-0"
        >
          <ArrowLeft size={15} />
          {isAuthenticated ? "Back to dashboard" : "Back"}
        </button>
        <StepIndicator stepId="paying-member" />
        <div className="text-center mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            Are you a paying member of this community?
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Some admins manage communities without contributing financially. Let us know so we set up your account correctly.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-8 w-full">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`flex-1 relative flex flex-row lg:flex-col items-center text-left lg:text-center gap-4 lg:gap-0 px-5 lg:px-6 py-5 lg:py-8 rounded-2xl bg-white transition-all duration-200 cursor-pointer border-2 ${isSelected ? "border-brand" : "border-[#E5E5E5]"}`}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#EEF2FF] lg:bg-transparent lg:rounded-none lg:w-12 lg:h-12 lg:mb-3 lg:mt-2">
                  <img src={opt.icon} alt={opt.label} className="w-6 h-6 lg:w-12 lg:h-12 object-contain" />
                </div>
                <span className="flex-1 min-w-0 lg:flex-none text-sm font-medium text-gray-900">{opt.label}</span>
                <div className="flex-shrink-0 lg:absolute lg:top-3 lg:left-3">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-brand">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => go()}
          className="w-full max-w-sm py-4 rounded-3xl text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer bg-brand"
        >
          Continue
        </button>
        <button
          onClick={() => go(true)}
          className="mt-4 text-sm font-medium hover:underline bg-transparent border-none cursor-pointer text-brand"
        >
          Skip
        </button>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
