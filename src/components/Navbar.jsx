import { useEffect, useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { goToApp } from "../utils/deviceRedirect";
import { motion, useScroll, useSpring } from "motion/react";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  const viewMode =
    location.pathname === "/members" ? "members" : "organizations";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleViewModeChange = (mode) => {
    if (mode === "organizations") navigate("/");
    else if (mode === "members") navigate("/members");
  };

  return (
    <>
    <motion.div
      style={{ scaleX, transformOrigin: "0% 50%", background: "linear-gradient(90deg, #002FA7 0%, #4f46e5 60%, #7c3aed 100%)", height: 3, position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, pointerEvents: "none" }}
    />
    <nav
      className={`fixed top-0 left-0 right-0 z-50 min-h-[80px] transition-all duration-300 ${
        scrolled
          ? "bg-[#07091F]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      {/* ── Toggle pill mobile ── */}
      <div className="lg:hidden bg-white/[0.07] border border-white/[0.1] flex mt-[6px] mx-3 rounded-full">
        <button
          onClick={() => {
            handleViewModeChange("organizations");
            setMenuOpen(false);
          }}
          className={`flex-1 px-4 py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
            viewMode === "organizations"
              ? "bg-[#808080] text-white"
              : "text-white/55"
          }`}
        >
          Organizations
        </button>
        <button
          onClick={() => {
            handleViewModeChange("members");
            setMenuOpen(false);
          }}
          className={`flex-1 px-4 py-3 rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
            viewMode === "members" ? "bg-[#808080] text-white" : "text-white/55"
          }`}
        >
          Members
        </button>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 h-full flex items-center justify-between gap-6 py-4">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline shrink-0"
        >
          <img src="/Glass.webp" alt="Glass" className="w-8 h-8" />
          <span className="font-bold text-[17px] text-white tracking-tight">
            Glass
          </span>
        </Link>

        {/* ── Toggle Pill (desktop) ── */}
        <div className="hidden lg:flex bg-white/[0.07] border border-white/[0.1] rounded-full p-[3px] items-center gap-0.5 backdrop-blur-sm cursor-pointer">
          <button
            onClick={() => handleViewModeChange("organizations")}
            className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all duration-200 ${
              viewMode === "organizations"
                ? "bg-white/15 text-white/70 shadow-sm"
                : "text-white/45 hover:text-white/50"
            }`}
          >
            Organizations
          </button>
          <button
            onClick={() => handleViewModeChange("members")}
            className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all duration-200 ${
              viewMode === "members"
                ? "bg-white/15 text-white/70 shadow-sm"
                : "text-white/45 hover:text-white/50"
            }`}
          >
            Members
          </button>
        </div>

        {/* ── Nav Links (desktop) ── */}
        <div className="hidden lg:flex items-center gap-7">
          <button
            onClick={() => scrollTo("use-cases")}
            className="text-[13.5px] text-white hover:text-white/55 transition-colors font-medium cursor-pointer"
          >
            Use Cases
          </button>
          <button
            onClick={() => scrollTo("how-it-works")}
            className="text-[13.5px] text-white hover:text-white/55 transition-colors font-medium cursor-pointer"
          >
            How It Works
          </button>
        </div>

        {/* ── CTA (desktop) ── */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {viewMode === "organizations" ? (
            <>
              <button
                onClick={() => goToApp("/sign-up", navigate)}
                className="flex items-center gap-1.5 bg-white text-[#0B0F2E] px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all hover:opacity-90 hover:-translate-y-px shadow-lg shadow-black/20 cursor-pointer"
              >
                Get Started Free
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => goToApp("/sign-in", navigate)}
                className="text-[13.5px] text-white/70 hover:text-white transition-colors font-medium"
              >
                Sign In
              </button>
            </>
          ) : (
            <button
              onClick={() => goToApp("/sign-in", navigate)}
              className="flex items-center gap-1.5 bg-white text-[#0B0F2E] px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all hover:opacity-90 hover:-translate-y-px shadow-lg shadow-black/20 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          {menuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* ── Mobile Dropdown ── */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0B0F2E]/98 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1 pt-1">
              {[
                { label: "Use Cases", id: "use-cases" },
                { label: "How It Works", id: "how-it-works" },
              ].map(({ label, id }) => (
                <button
                  key={label}
                  onClick={() => { scrollTo(id); setMenuOpen(false); }}
                  className="flex items-center justify-between w-full py-3 text-[14px] font-medium text-white/60 hover:text-white transition-colors border-b border-white/[0.05]"
                >
                  {label}
                </button>
              ))}
            </div>

            {viewMode === "organizations" ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    goToApp("/sign-up", navigate);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#0B0F2E] py-3 rounded-full text-[14px] font-bold cursor-pointer"
                >
                  Get Started Free <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    goToApp("/sign-in", navigate);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-white/70 py-2 text-[14px] font-medium cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  goToApp("/sign-in", navigate);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0B0F2E] py-3 rounded-full text-[14px] font-bold cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
