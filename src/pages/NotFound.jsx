import { useNavigate } from "react-router-dom";
import GlassLogo from "../assets/Glass.png";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="w-12 h-12 rounded-2xl bg-[#002FA7] flex items-center justify-center mb-8">
        <img src={GlassLogo} alt="Glass" className="w-6 h-6 object-contain brightness-0 invert" />
      </div>

      {/* 404 */}
      <p className="text-[80px] font-black text-[#002FA7] leading-none mb-4 tracking-tight">404</p>

      <h1 className="text-[22px] font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-[14px] text-gray-500 max-w-[320px] leading-relaxed mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-full border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
        >
          Go back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 rounded-full bg-[#002FA7] text-[13px] font-semibold text-white hover:bg-[#0027a0] transition-colors cursor-pointer border-none"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
