import { useNavigate } from "react-router-dom";
import GlassLogo from "../../../assets/Glass.webp";
import QRCodeCanvas from "../../../components/common/QRCodeCanvas";
import { buildMobileUrl } from "../../../utils/deviceRedirect";
import { Button } from "../../../components/ui/Button";
import GlassLogoGlow from "../../../components/memberApp/GlassLogoGlow";

export default function CheckEmail() {
  const navigate  = useNavigate();
  const joinUrl   = buildMobileUrl("/member/join");

  return (
    <div className="relative z-0 h-screen w-screen flex flex-col overflow-hidden bg-[#E5E5E5]">
      <GlassLogoGlow />

      {/* Glass logo top left */}
      <header className="px-8 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-6 h-6 object-contain" />
          <span className="font-medium text-gray-900 text-base font-sans">
            Glass
          </span>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-2 overflow-hidden">
        <div className="w-full max-w-xl flex flex-col items-center">

          <h1 className="text-2xl font-bold text-gray-900 mb-1.5 text-center font-sans">
            Scan To Join From Your Phone
          </h1>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Glass for members is best experienced on mobile!
          </p>

          <QRCodeCanvas value={joinUrl} size={170} color="#000000" />

          <Button
            onClick={() => navigate("/")}
            fullWidth={false}
            className="w-[170px] mt-4"
          >
            Continue
          </Button>

        </div>
      </main>
    </div>
  );
}
