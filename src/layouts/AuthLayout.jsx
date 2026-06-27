import { useNavigate } from "react-router-dom";
import AuthPanel from "../assets/auth/auth-panel.png";
import glassLogo from "../assets/cta/ctalogo.png";

export default function AuthLayout({ heroTitle, heroSubtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-[#F5F5F6] md:p-2">
      {/* Hero panel — full side panel on desktop; collapses into a short top
          banner on mobile instead of disappearing, matching the member-side
          mobile auth screens (Join.jsx) rather than just hiding the logo. */}
      <div className="w-full h-[26vh] min-h-[150px] md:w-[46%] md:h-full flex-shrink-0">
        <div className="relative w-full h-full md:rounded-3xl overflow-hidden">
          <img
            src={AuthPanel}
            alt="Glass Finance"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Logo */}
          <div className="absolute top-5 left-5 md:top-8 md:left-8 z-10">
            <img
              src={glassLogo}
              alt="Glass Logo"
              className="h-8 md:h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Center text — desktop only, the mobile banner is too short for
              it and the form below already carries its own heading */}
          {(heroTitle || heroSubtitle) && (
            <div className="hidden md:flex absolute inset-0 items-center justify-center z-10 px-8">
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

      {/* Form content */}
      {/* No justify-center here: when content (e.g. the registration form)
          is taller than the viewport, centering a scrollable flex container
          crops the top of the content — including the heading — above the
          visible scroll area. Top-aligning with padding keeps the start of
          the content reachable on load for forms of any height. */}
      <div className="flex-1 flex flex-col items-center px-6 md:px-12 py-8 md:py-10 bg-[#F5F5F6] overflow-y-auto min-h-0 rounded-t-[20px] md:rounded-none -mt-5 md:mt-0">
        {children}
      </div>
    </div>
  );
}
