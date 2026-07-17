import { useNavigate } from "react-router-dom";
import AuthPanel from "../assets/auth/auth-panel.webp";
import glassLogo from "../assets/cta/ctalogo.webp";
import glassIcon from "../assets/Glass.webp";
import AuthBackground from "../assets/auth-background.webp";
import MobileAuthBackground from "../assets/mobile-auth-background.webp";

export default function AuthLayout({ heroTitle, heroSubtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-surface-bg md:p-2 relative">
      {/* Background — separate mobile/desktop images (different aspect
          ratios), swapped by breakpoint visibility rather than one shared
          background-image, since the two assets aren't the same crop. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          backgroundImage: `url(${MobileAuthBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="hidden md:block absolute inset-0"
        style={{
          backgroundImage: `url(${AuthBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ── Mobile header ──
          Replaces the hero image entirely below md -- a plain logo +
          wordmark bar with a hairline divider, matching the reference
          design's mobile screens (no hero illustration/welcome text on
          small screens at all). */}
      <div className="md:hidden relative z-20 flex-shrink-0">
        <div className="flex items-center gap-2 px-6 pt-5 pb-4">
          <img src={glassIcon} alt="" className="h-7 w-7 object-contain" />
          <span className="text-lg font-semibold text-gray-900">Glass</span>
        </div>
        <div className="h-px bg-gray-200" />
      </div>

      {/* ── Hero panel — desktop only ── */}
      <div className="hidden md:block md:w-[46%] md:h-full flex-shrink-0 relative z-10">
        <div className="relative w-full h-full md:rounded-3xl overflow-hidden">
          <img
            src={AuthPanel}
            alt="Glass Finance"
            className="absolute inset-0 w-full h-full object-cover"
            fetchpriority="high"
            decoding="async"
          />

          {/* Logo — no wrapping card per design; the backdrop-blur overlay
              this used to sit in was also a likely cause of the slow first
              paint reported on Brave (120px backdrop-filter is expensive to
              composite). Still clickable back to the landing page. */}
          <img
            src={glassLogo}
            alt="Glass Logo"
            className="absolute top-8 left-8 z-10 h-10 w-auto object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />

          {(heroTitle || heroSubtitle) && (
            <div className="flex absolute inset-0 items-center justify-center z-10 px-8">
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

      {/* ── Form sheet ──
          Mobile: top-aligned directly below the header, flush, no card
          treatment (there's no hero panel left to pull up over).
          Desktop: unchanged, vertically centered right column. */}
      <div
        className="flex-1 flex flex-col items-center justify-start md:justify-center px-6 md:px-12
                   py-8 md:py-10 overflow-y-auto min-h-0 relative z-20"
      >
        {children}
        <div style={{ height: "env(safe-area-inset-bottom, 20px)" }} />
      </div>
    </div>
  );
}
