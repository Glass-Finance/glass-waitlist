import { useNavigate, useLocation } from "react-router-dom";
import QRScanScreen from "../../components/auth/QRScanScreen";
import { buildMobileUrl } from "../../utils/deviceRedirect";

export default function CheckEmail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";
  const joinUrl   = buildMobileUrl("/member/join");

  return (
    <QRScanScreen
      heading="Scan To Join From Your Phone"
      subheading="Glass for members is best experienced on mobile!"
      url={joinUrl}
      onContinue={() => navigate("/dashboard/home")}
    >
      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-sm my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-gray-400 flex-shrink-0">Or Use Email</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Email fallback */}
      <p className="text-sm text-gray-500 text-center max-w-sm mb-3">
        We've also sent a link{" "}
        {email && <span className="font-medium text-gray-900">{email}.</span>}
        {" "}Open it on your phone to join your community on Glass.
      </p>

      <p className="text-sm text-gray-900">
        Didn't get it?{" "}
        <button
          className="font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
          style={{ color: "#002FA7" }}
        >
          Resend Email
        </button>
      </p>
    </QRScanScreen>
  );
}
