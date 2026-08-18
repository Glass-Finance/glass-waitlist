import { useEffect, useRef, useState } from "react";
import BlurText from "./ui/BlurText";
import iconSchools from "../assets/usecase/icon-schools.webp";
import iconProfessional from "../assets/usecase/icon-professional.webp";
import iconClubs from "../assets/usecase/icon-clubs.webp";
import iconReligious from "../assets/usecase/icon-religious.webp";

// ── Import your corner line assets ─────────────────────────────────────────
// Two variants: top-left corner and bottom-right corner
// Place them in src/assets/usecase/
import cornerTL from "../assets/usecase/corner-tl.webp"; // top-left curved line
import cornerBR from "../assets/usecase/corner-br.webp"; // bottom-right curved line

// ─── Card icon map — uses your imported images ────────────────────────────────
const CARD_ICONS = {
  schools: iconSchools,
  professional: iconProfessional,
  clubs: iconClubs,
  religious: iconReligious,
};

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
      className="relative h-[380px] rounded-3xl bg-[#F5F5F8] shadow-[0_0_0_1px_rgba(255,255,255,0.75)_inset,0_2px_20px_rgba(28,43,138,0.08)] flex flex-col items-center justify-center gap-3 py-8 px-7 text-center overflow-hidden opacity-0"
      style={{
        animation: inView
          ? `ucCardIn 0.7s cubic-bezier(0.22,1,0.36,1) ${entryDelay}ms forwards`
          : "none",
      }}
    >
      {/* Top-left corner line — imported asset */}
      <img
        src={cornerTL}
        alt=""
        draggable={false}
        className="absolute top-0 left-0 w-20 h-20 object-contain opacity-55 pointer-events-none"
        loading="lazy"
        decoding="async"
      />

      {/* Bottom-right corner line — imported asset (rotated 180°) */}
      <img
        src={cornerBR}
        alt=""
        draggable={false}
        className="absolute bottom-0 right-0 w-20 h-20 object-contain opacity-45 pointer-events-none"
        loading="lazy"
        decoding="async"
      />

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
