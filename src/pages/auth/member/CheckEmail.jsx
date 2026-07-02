import { useNavigate, useLocation } from "react-router-dom";
import GlassLogo from "../../../assets/Glass.png";
import QRCodeCanvas from "../../../components/dashboard/QRCode";
import { buildMobileUrl } from "../../../utils/deviceRedirect";

export default function CheckEmail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";
  const joinUrl   = buildMobileUrl("/member/join");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#E5E5E5" }}>

      {/* Glass logo top left */}
      <header className="px-8 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-6 h-6 object-contain" decoding="async" loading="lazy" />
          <span className="font-semibold text-gray-900 text-base" style={{ fontFamily: "var(--font-sans)" }}>
            Glass
          </span>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-2 overflow-hidden">
        <div className="w-full max-w-xl flex flex-col items-center">

          <h1 className="text-2xl font-bold text-gray-900 mb-1.5 text-center" style={{ fontFamily: "var(--font-sans)" }}>
            Scan To Join From Your Phone
          </h1>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Glass for members is best experienced on mobile!
          </p>

          <QRCodeCanvas value={joinUrl} size={170} color="#000000" />

          <button
            onClick={() => navigate("/dashboard/home")}
            className="w-full max-w-xl mt-4 py-3 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] border-none cursor-pointer"
            style={{ background: "#002FA7" }}
          >
            Continue
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full my-3">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-400 flex-shrink-0">Or Use Email</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Email fallback */}
          <p className="text-sm text-gray-500 text-center mb-1.5">
            We've also sent a link{" "}
            {email && <span className="font-medium text-gray-900">{email}.</span>}
            {" "}Open it on your phone to join your community on Glass.
          </p>

          <p className="text-sm text-gray-900 text-center">
            Didn't get it?{" "}
            <button
              className="font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
              style={{ color: "#002FA7" }}
            >
              Resend Email
            </button>
          </p>

        </div>
      </main>
    </div>
  );
}
