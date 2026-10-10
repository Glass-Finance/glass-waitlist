import { useNavigate } from "react-router-dom";
import GlassLogoGlow from "../../../../components/memberApp/GlassLogoGlow";
import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { MobileBackButton } from "../../../../components/ui/MobileBackButton";

const ITEMS = [
  {
    Icon: Lock,
    label: "Password",
    desc: "Change your account password",
    to: "/member/security/password",
  },
  {
    Icon: ShieldCheck,
    label: "Multi-Factor Authentication",
    desc: "Secure your account with an authenticator app",
    to: "/member/security/authentication",
  },
];

export default function Security() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden min-h-screen pb-10">
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <MobileBackButton aria-label="Back" onClick={() => navigate(-1)} />
        <h1 className="text-lg font-semibold text-ink m-0">Security</h1>
      </div>

      <div className="px-4">
        <div className="border border-surface-container-border bg-white rounded-2xl overflow-hidden">
          {ITEMS.map(({ Icon, label, desc, to }, i) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`flex items-center gap-3 w-full text-left py-3.5 px-4 bg-transparent border-none cursor-pointer ${i < ITEMS.length - 1 ? "border-b border-hairline-soft" : "border-b-0"}`}
            >
              <div className="w-9 h-9 rounded-[10px] bg-brand-wash flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-brand-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink m-0">{label}</p>
                <p className="text-xs text-ink-ghost mt-0.5 mx-0 mb-0">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-[#ccc] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
