import { useEffect, useRef, useState } from "react";
import BlurText from "./ui/BlurText";
import iconSchools from "../assets/usecase/icon-schools.webp";
import iconProfessional from "../assets/usecase/icon-professional.webp";
import iconClubs from "../assets/usecase/icon-clubs.webp";
import iconReligious from "../assets/usecase/icon-religious.webp";

// ─── Card icon map — uses your imported images ────────────────────────────────
const CARD_ICONS = {
  schools: iconSchools,
  professional: iconProfessional,
  clubs: iconClubs,
  religious: iconReligious,
};

// ─── Corner accent — inline SVG (not a raster image), so it stays crisp at any
// size/DPI and can carry a live "traveling light" animation along the line,
// plus a pulsing diamond. `rotate-180` on the wrapper turns the top-left
// variant into the bottom-right one.
function CornerAccent({ className = "" }) {
  // vertical -> bend -> short horizontal run -> bend -> vertical again -> sparkle
  const d = "M12 0 L12 44 Q12 54 22 54 L36 54 Q46 54 46 64 L46 84";
  return (
    <svg
      viewBox="0 0 53 100"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <path d={d} stroke="#7C3AED" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
      <path
        d={d}
        stroke="#C4B5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="16 84"
        className="uc-corner-travel"
      />
      {/* Sparkle marker — same 4-point star path as Lucide's Sparkle icon.
          The static position/size lives on this outer <g> (an SVG transform
          attribute); the pulse animation's CSS transform goes on the <path>
          itself instead of here, since a CSS transform on an element wins
          outright over that same element's transform attribute -- nesting
          keeps the two from fighting over one element. */}
      <g transform="translate(41,82) scale(0.4167)">
        <path
          d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
          fill="#7C3AED"
          className="uc-corner-diamond"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      </g>
    </svg>
  );
}

// ─── Use case card ──────────────────────────────────────────────────────────
function UseCaseCard({ title, desc, variant, entryDelay }) {
  const cardRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="uc-card relative h-[380px] rounded-3xl bg-[#F5F5F8] shadow-[0_0_0_1px_rgba(255,255,255,0.75)_inset,0_2px_20px_rgba(28,43,138,0.08)] flex flex-col items-center justify-center gap-3 py-8 px-7 text-center overflow-hidden opacity-0"
      style={{
        animation: inView
          ? `ucCardIn 0.7s cubic-bezier(0.22,1,0.36,1) ${entryDelay}ms forwards`
          : "none",
      }}
    >
      {/* Top-left corner line — bob animation lives on this wrapper, not the
          SVG itself, so it doesn't collide with the bottom-right one's own
          rotate-180 (both are `transform`, and only one value can win). */}
      <div className="uc-corner-wrap absolute top-0 left-0 w-20 h-20 pointer-events-none">
        <CornerAccent className="w-20 h-20" />
      </div>

      {/* Bottom-right corner line — same accent, rotated 180° */}
      <div className="uc-corner-wrap absolute bottom-0 right-0 w-20 h-20 pointer-events-none">
        <CornerAccent className="w-20 h-20 rotate-180" />
      </div>

      {/* Icon circle — your imported image */}
      <img
        src={CARD_ICONS[variant]}
        alt={title}
        className="w-[72px] h-[72px] object-contain mb-1"
        loading="lazy"
        decoding="async"
      />

      {/* Title */}
      <h3 className="text-[clamp(20px,4vw,24px)] font-medium text-[#001F6E] leading-[1.25] m-0">
        {title}
      </h3>

      {/* Desc */}
      <p className="text-lg text-black/50 leading-[1.6] m-0 max-w-[360px]">
        {desc}
      </p>
    </div>
  );
}

// ─── Cases data ───────────────────────────────────────────────────────────────
const cases = [
  {
    title: "Schools & Alumni",
    desc: "Collect fees and dues without stress.",
    variant: "schools",
  },
  {
    title: "Professional Bodies",
    desc: "Manage dues and certification fees effortlessly.",
    variant: "professional",
  },
  {
    title: "Clubs & Associations",
    desc: "Collect monthly dues and event fees in seconds, not hours.",
    variant: "clubs",
  },
  {
    title: "Religious Organizations",
    desc: "Track tithes and contributions with full transparency.",
    variant: "religious",
  },
];

// ─── Main export ──────────────────────────────────────────────────────────────
export default function UseCases() {
  const containerRef = useRef(null);

  return (
    <>
      <style>{`
        @keyframes ucCardIn {
          from { opacity: 0; transform: translateY(36px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ucCornerTravel {
          0%   { stroke-dashoffset: 100; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { stroke-dashoffset: -20; opacity: 0; }
        }
        .uc-corner-travel {
          animation: ucCornerTravel 2.4s ease-in-out infinite;
        }
        @keyframes ucCornerDiamondPulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.35); }
        }
        .uc-corner-diamond {
          animation: ucCornerDiamondPulse 2.4s ease-in-out infinite;
        }
        @keyframes ucCornerBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .uc-card:hover .uc-corner-wrap {
          animation: ucCornerBob 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .uc-corner-travel, .uc-corner-diamond, .uc-card:hover .uc-corner-wrap { animation: none; }
        }
      `}</style>

      <section
        ref={containerRef}
        className="py-20 md:py-28 relative isolate overflow-hidden"
        id="use-cases"
      >

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          {/* ── Header ── */}
          <div className="text-center mb-14">
            {/* Badge */}
            <div className="mb-5 flex justify-center">
              <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full">
                Use Cases
              </span>
            </div>

            {/* Headline */}
            <div className="flex justify-center mb-4">
              <h2 className="text-[clamp(26px,5.5vw,64px)] font-bold text-[#0f1d6e] leading-[1.15] tracking-[-0.02em] max-w-[1080px] text-center">
                <BlurText
                  text="Built for every Nigerian community"
                  animateBy="words"
                  direction="top"
                  delay={65}
                  stepDuration={0.42}
                  centered
                />
              </h2>
            </div>

            {/* Subtext */}
            <div className="flex justify-center">
              <p className="text-[clamp(15px,2vw,17px)] text-black/60 max-w-[700px] leading-[1.7] text-center">
                Whether you run a small club or a national association, Glass scales with you.
              </p>
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {cases.map(({ title, desc, variant }, i) => (
              <UseCaseCard
                key={title}
                title={title}
                desc={desc}
                variant={variant}
                entryDelay={150 + i * 110}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
