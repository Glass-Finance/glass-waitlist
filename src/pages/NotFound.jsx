import { useNavigate } from "react-router-dom";
import CtaLogo from "../assets/cta/ctalogo.png";
import Background from "../assets/background.png";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Logo — no container */}
      <img
        src={CtaLogo}
        alt="Glass"
        className="w-10 h-10 object-contain mb-10"
      />

      {/* 404 */}
      <p
        className="font-black leading-none tracking-tighter mb-5 select-none"
        style={{ fontSize: "clamp(96px, 20vw, 160px)", color: "#002FA7", opacity: 0.12 }}
      >
        404
      </p>

      {/* Text sits over the large faded 404 */}
      <div style={{ marginTop: "-2.5rem" }}>
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-[14px] text-gray-500 max-w-[300px] leading-relaxed mb-8 mx-auto">
          This page doesn't exist or may have been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full text-[13px] font-medium text-gray-700 cursor-pointer transition-colors"
            style={{ background: "#FFFFFF99", border: "1px solid #E5E7EB", backdropFilter: "blur(4px)" }}
          >
            Go back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white cursor-pointer border-none transition-opacity hover:opacity-90"
            style={{ background: "#002FA7" }}
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
