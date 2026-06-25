import { useNavigate } from "react-router-dom";
import AuthPanel from "../assets/auth/auth-panel.png";
import glassLogo from "../assets/cta/ctalogo.png";

export default function AuthLayout({ heroTitle, heroSubtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F6] p-2">
      {/* Left panel */}
      <div className="hidden md:block w-[46%] h-full flex-shrink-0">
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          <img
            src={AuthPanel}
            alt="Glass Finance"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Logo */}
          <div className="absolute top-8 left-8 z-10">
            <img
              src={glassLogo}
              alt="Glass Logo"
              className="h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Center text */}
          {(heroTitle || heroSubtitle) && (
            <div className="absolute inset-0 flex items-center justify-center z-10 px-8">
              <div className="text-center">
                {heroTitle && (
                  <h1
                    className="text-white font-normal leading-tight"
                    style={{
                      fontSize: "clamp(2rem, 3vw, 2rem)",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {heroTitle}
                  </h1>
                )}
                {heroSubtitle && (
                  <h2
                    className="text-white font-normal leading-tight mt-2"
                    style={{
                      fontSize: "clamp(2rem, 3vw, 2rem)",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {heroSubtitle}
                  </h2>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 h-full flex flex-col justify-center items-center px-12 bg-[#F5F5F6] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
