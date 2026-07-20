import { useNavigate } from "react-router-dom";
import GlassLogo from "../assets/Glass.webp";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-cover bg-center bg-page-default"
    >
      {/* Logo — no container */}
      <img
        src={GlassLogo}
        alt="Glass"
        className="w-10 h-10 object-contain mb-10"
      />

      {/* 404 */}
      <p
        className="font-black leading-none tracking-tighter mb-5 select-none text-[clamp(96px,20vw,160px)] text-brand opacity-[0.12]"
      >
        404
      </p>

      {/* Text sits over the large faded 404 */}
      <div className="-mt-10">
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-[14px] text-gray-500 max-w-[300px] leading-relaxed mb-8 mx-auto">
          This page doesn't exist or may have been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full text-[13px] font-medium text-gray-700 cursor-pointer transition-colors bg-surface-container border border-[#E5E7EB] backdrop-blur-xs"
          >
            Go back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white cursor-pointer border-none transition-opacity hover:opacity-90 bg-brand"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
