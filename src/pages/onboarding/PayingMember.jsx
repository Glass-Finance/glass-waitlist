/**
 * PayingMember.jsx — pure UI, no API.
 * Passes isPaying flag to OrganizationProfile via router state.
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GlassLogo from "../../assets/Glass.webp";
import PayingMemberIcon from "../../assets/auth/paying-dues.webp";
import ExemptPaymentIcon from "../../assets/auth/exempt-payments.webp";
import StepIndicator from "../../components/onboarding/StepIndicator";

export default function PayingMember() {
  const navigate = useNavigate();
  const location = useLocation();
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

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden px-6 bg-contain bg-center bg-page-default"
    >
      <div className="absolute top-5 left-8 flex items-center gap-2">
        <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
        <span className="font-semibold text-gray-900">Glass</span>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center">
        <StepIndicator stepId="paying-member" />
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Are you a paying member of this community?
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Some admins manage communities without contributing financially. Let us know so we set up your account correctly.
          </p>
        </div>

        <div className="flex gap-4 mb-8 w-full">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`flex-1 relative flex flex-col items-center text-center px-6 py-8 rounded-2xl bg-white transition-all duration-200 cursor-pointer border-2 ${isSelected ? "border-brand" : "border-[#E5E5E5]"}`}
              >
                <div className="absolute top-3 left-3">
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
                <div className="mb-3 mt-2">
                  <img src={opt.icon} alt={opt.label} className="w-12 h-12 object-contain mx-auto" />
                </div>
                <span className="text-sm font-medium text-gray-900">{opt.label}</span>
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
      </div>
    </div>
  );
}