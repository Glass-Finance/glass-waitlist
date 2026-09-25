import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Bell,
  CreditCard,
  RefreshCw,
  Users,
  LogOut,
  IdCard,
} from "lucide-react";
import { useAuth } from "../../../store/AuthContext";
import GlassLogoGlow from "../../../components/memberApp/GlassLogoGlow";
import { toastSuccess } from "../../../utils/toast";
import { useKycSummary } from "../../../hooks/useKyc";
import KycStatusBadge from "../../../components/memberApp/KycStatusBadge";
import KycWizardModal from "../../../components/kyc/KycWizardModal";
import { kycDisabled } from "../../../lib/flags";

const SECTIONS = [
  {
    label: "Account",
    items: [
      {
        Icon: User,
        label: "Profile",
        desc: "Your name, email and phone number",
        to: "/member/profile",
      },
      {
        Icon: IdCard,
        label: "Identity Verification",
        desc: "Verify your identity with Smile ID",
        to: "/member/verify-identity",
        kyc: true,
      },
      {
        Icon: Shield,
        label: "Security",
        desc: "Password and login protection",
        to: "/member/security",
      },
      {
        Icon: Bell,
        label: "Notifications",
        desc: "What you get notified about",
        to: "/member/notification-settings",
      },
    ],
  },
  {
    label: "Payments",
    items: [
      {
        Icon: CreditCard,
        label: "Payment Methods",
        desc: "Saved banks and auto-pay methods",
        to: "/member/saved-cards",
      },
      {
        Icon: RefreshCw,
        label: "Auto-Pay",
        desc: "Plans set to charge automatically",
        to: "/member/auto-pay",
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        Icon: Users,
        label: "My Communities",
        desc: "Communities you belong to",
        to: "/member/communities",
      },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const hideKyc = kycDisabled();
  const { data: kycSummary } = useKycSummary();
  // The Identity Verification row opens the wizard modal in place instead
  // of routing to the verify page (same flow, no context switch).
  const [kycWizardOpen, setKycWizardOpen] = useState(false);
  const sections = hideKyc
    ? SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter((item) => !item.kyc),
      }))
    : SECTIONS;

  async function handleLogout() {
    await logout();
    toastSuccess("Signed out");
    // Not /sign-in -- that's the org/admin sign-in page. This is the member
    // app's own Settings, so the sign-up link there needs to point back at
    // /member/join, not /sign-up (see SignIn.jsx's isMemberSignIn check).
    navigate("/member/app-sign-in");
  }

  return (
    <div className="relative overflow-hidden min-h-screen pb-10">
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Settings</h1>
      </div>

      <div className="px-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="text-xs font-semibold text-[#999] mt-0 mx-1 mb-2 uppercase [letter-spacing:0.4px]">
              {section.label}
            </p>
            <div className="border border-surface-container-border bg-white rounded-2xl overflow-hidden">
              {section.items.map(({ Icon, label, desc, to, kyc }, i) => (
                <button
                  key={label}
                  onClick={() => (kyc ? setKycWizardOpen(true) : navigate(to))}
                  className={`flex items-center gap-3 w-full text-left py-3.5 px-4 bg-transparent border-none cursor-pointer ${i < section.items.length - 1 ? "border-b border-[#F2F2F2]" : "border-b-0"}`}
                >
                  <div className="w-9 h-9 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#1C2B8A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111] m-0">{label}</p>
                    <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">{desc}</p>
                  </div>
                  {kyc && kycSummary?.status && (
                    <KycStatusBadge status={kycSummary.status} className="mr-1 flex-shrink-0" />
                  )}
                  <ChevronRight size={16} className="text-[#ccc] flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="border border-surface-container-border flex items-center gap-2.5 w-full text-left py-3.5 px-4 bg-white rounded-2xl cursor-pointer"
        >
          <LogOut size={16} className="text-brand" />
          <span className="text-sm font-medium text-brand">Log Out</span>
        </button>
      </div>

      <KycWizardModal
        open={kycWizardOpen}
        onClose={() => setKycWizardOpen(false)}
        historyPath="/member/verify-identity/history"
      />
    </div>
  );
}
