import { useNavigate, useSearchParams } from "react-router-dom";
import GlassLogo from "../../../assets/Glass.webp";
import QRCodeCanvas from "../../../components/dashboard/QRCode";
import { buildMobileUrl } from "../../../utils/deviceRedirect";
import { useAuth } from "../../../store/AuthContext";

export default function MobileRequired() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const target = searchParams.get("to") || "/member/app-sign-in";
  const url = buildMobileUrl(target);

  // Admins have a real desktop home to go to; a pure member doesn't --
  // sending them to /dashboard/home would just get bounced by
  // ProtectedRoute back to /member/home, which is itself mobile-gated,
  // landing them right back on this page.
  const continueTo = isAdmin ? "/dashboard/home" : "/";

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
        <div className="w-full max-w-xl flex flex-col items-center">
          <h1
            className="text-2xl font-bold text-gray-900 mb-1.5 text-center font-sans"
          >
            Scan To Continue On Your Phone
          </h1>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Glass for members is best experienced on mobile!
          </p>

          <QRCodeCanvas value={url} size={200} color="#000000" />

          <button
            onClick={() => navigate(continueTo)}
            className="w-full max-w-md mt-4 py-3 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] border-none cursor-pointer bg-brand"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
