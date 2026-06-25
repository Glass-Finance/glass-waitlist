import { useSearchParams } from "react-router-dom";
import { Smartphone } from "lucide-react";
import QRCodeCanvas from "../../components/dashboard/QRCode";
import { buildMobileUrl } from "../../utils/deviceRedirect";
import glassLogo from "../../assets/cta/ctalogo.png";

export default function MobileRequired() {
  const [searchParams] = useSearchParams();
  const target = searchParams.get("to") || "/member/sign-in";
  const url = buildMobileUrl(target);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#F5F5F6" }}>
      <img src={glassLogo} alt="Glass" className="h-10 w-auto object-contain mb-10" />

      <div className="bg-white rounded-3xl shadow-sm px-10 py-12 flex flex-col items-center max-w-md text-center" style={{ border: "1px solid #EFEFEF" }}>
        <div className="w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-5">
          <Smartphone size={24} className="text-[#1C2B8A]" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          This experience is only available on mobile devices.
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Scan this QR code with your phone to continue.
        </p>

        <div className="p-3 bg-white rounded-2xl mb-6" style={{ border: "1px solid #E5E7EB" }}>
          <QRCodeCanvas value={url} size={180} />
        </div>

        <p className="text-xs text-gray-400 break-all">{url}</p>
      </div>
    </div>
  );
}
