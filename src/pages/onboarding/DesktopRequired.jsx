import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import { buildMobileUrl } from "../../utils/deviceRedirect";
import { useAuth } from "../../store/AuthContext";

export default function DesktopRequired() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const target = searchParams.get("to") || "/onboarding/choose-path";
  const url = buildMobileUrl(target);
  const [copied, setCopied] = useState(false);

  // Mirrors MobileRequired.jsx's continueTo logic for the opposite
  // direction — a brand-new signup isn't an admin of anything yet, so
  // /member/home is the only real destination that won't just bounce them
  // back here (they're still on mobile).
  const continueTo = isAdmin ? "/dashboard/home" : "/member/home";

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden bg-cover bg-center bg-page-default"
    >
      <header className="px-8 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-6 h-6 object-contain" />
          <span
            className="font-semibold text-gray-900 text-base font-sans"
          >
            Glass
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-2 overflow-hidden">
        <div className="w-full max-w-xl flex flex-col items-center text-center">
          <h1
            className="text-2xl font-bold text-gray-900 mb-1.5 font-sans"
          >
            Continue On A Computer
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Setting up a community needs a bigger screen. Copy this link and open it on a desktop or laptop.
          </p>

          <div
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-4 bg-[#EEF2FF] border border-[#C7D2FE]"
          >
            <span className="text-sm text-brand font-medium truncate">{url}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white border-none cursor-pointer flex-shrink-0 hover:opacity-90 bg-brand"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button
            onClick={() => navigate(continueTo)}
            className="w-full max-w-md py-3 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] border-none cursor-pointer bg-brand"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
