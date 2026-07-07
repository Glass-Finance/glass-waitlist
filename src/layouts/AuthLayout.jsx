import { useNavigate } from "react-router-dom";
import AuthPanel from "../assets/auth/auth-panel.webp";
import glassLogo from "../assets/cta/ctalogo.webp";

export default function AuthLayout({ heroTitle, heroSubtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-[#EFEFEF] md:p-2">
      {/* ── Hero panel ───────────────────────────────────────────────────── */}
      {/* Mobile: 45vh full-bleed image with gradient + welcome text        */}
      {/* Desktop: side panel, unchanged                                     */}
      {/* ── Hero panel ── */}
      <div className="w-full flex-shrink-0 h-[35vh] min-h-[220px] md:w-[46%] md:h-full">
        <div className="relative w-full h-full md:rounded-3xl overflow-hidden">
          <img
            src={AuthPanel}
            alt="Glass Finance"
            className="absolute inset-0 w-full h-full object-cover"
            fetchpriority="high"
            decoding="async"
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

          {/* Welcome text — mobile only, sits at the bottom of the hero */}
          {heroTitle && (
            <div
              className="md:hidden absolute bottom-0 left-0 right-0 text-center
                         px-8 pb-10 z-10 flex flex-col items-center gap-1"
            >
              <p
                className="text-white font-medium leading-snug"
                style={{ fontSize: "clamp(22px, 4vw, 22px)" }}
              >
                {heroTitle}
              </p>
              {heroSubtitle && (
                <p
                  className="text-white font-medium leading-snug opacity-90"
                  style={{ fontSize: "clamp(22px, 4vw, 22px)" }}
                >
                  {heroSubtitle}
                </p>
              )}
            </div>
          )}

          {/* Center text — desktop only (unchanged) */}
          {(heroTitle || heroSubtitle) && (
            <div
              className="hidden md:flex absolute inset-0 items-center
                            justify-center z-10 px-8"
            >
              <div className="text-center">
                {heroTitle && (
                  <h1
                    className="text-white font-normal leading-tight"
                    style={{
                      fontSize: "clamp(2rem, 2vw, 2rem)",
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
                      fontSize: "clamp(2rem, 2vw, 2rem)",
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

      {/* ── Form sheet ───────────────────────────────────────────────────── */}
      {/* Mobile: pulls up -28px over the hero with rounded top corners     */}
      {/* Desktop: unchanged right column                                   */}
      <div
        className="flex-1 flex flex-col items-center px-6 md:px-12
                   py-8 md:py-10 bg-[#EFEFEF] overflow-y-auto min-h-0
                   md:rounded-none z-20"
        style={{
          borderRadius: "12px 12px 0 0", // overridden to none on md via className
          marginTop: -10 , // the pull-up; md resets this below
        }}
      >
        {children}
        <div style={{ height: "env(safe-area-inset-bottom, 20px)" }} />
      </div>
    </div>
  );
}
