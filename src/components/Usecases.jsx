import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
// import case1 from "../assets/usecase/case1.webp";
// import case2 from "../assets/usecase/case2.webp";
// import case3 from "../assets/usecase/case3.webp";
// import case4 from "../assets/usecase/case4.webp";

// ── Import your real icons ──────────────────────────────────────────────────
// Place your 4 card icons in src/assets/usecase/
import iconSchools from "../assets/usecase/icon-schools.webp";
import iconProfessional from "../assets/usecase/icon-professional.webp";
import iconClubs from "../assets/usecase/icon-clubs.webp";
import iconReligious from "../assets/usecase/icon-religious.webp";

// ── Import your corner line assets ─────────────────────────────────────────
// Two variants: top-left corner and bottom-right corner
// Place them in src/assets/usecase/
import cornerTL from "../assets/usecase/corner-tl.webp"; // top-left curved line
import cornerBR from "../assets/usecase/corner-br.webp"; // bottom-right curved line

// ─── BlurText (inline) ────────────────────────────────────────────────────────
const buildKeyframes = (from, steps) => {
  const keys = new Set([
    ...Object.keys(from),
    ...steps.flatMap((s) => Object.keys(s)),
  ]);
  const kf = {};
  keys.forEach((k) => {
    kf[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return kf;
};

function BlurText({
  text = "",
  delay = 70,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.15,
  stepDuration = 0.4,
  centered = false,
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  const from =
    direction === "top"
      ? { filter: "blur(8px)", opacity: 0, y: -18 }
      : { filter: "blur(8px)", opacity: 0, y: 18 };
  const to = [
    { filter: "blur(3px)", opacity: 0.5, y: direction === "top" ? 2 : -2 },
    { filter: "blur(0px)", opacity: 1, y: 0 },
  ];
  const totalDuration = stepDuration * to.length;
  const times = Array.from({ length: to.length + 1 }, (_, i) => i / to.length);
  const kf = buildKeyframes(from, to);

  return (
    <span
      ref={ref}
      className={`inline-flex flex-wrap ${centered ? "justify-center w-full" : "justify-start w-auto"} ${className}`}
    >
      {elements.map((seg, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-[transform,filter,opacity]"
          initial={from}
          animate={inView ? kf : from}
          transition={{
            duration: totalDuration,
            times,
            delay: (i * delay) / 1000,
            ease: "easeOut",
          }}
        >
          {seg === " " ? "\u00A0" : seg}
          {animateBy === "words" && i < elements.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Community mock UI (back of card) ────────────────────────────────────────
function CommunityMock({ variant }) {
  const mocks = {
    schools: {
      name: "Kings College Alumni",
      tag: "Education",
      tagCls: "text-[#002FA7] bg-[#e6eeff]",
      members: ["AO", "BK", "CF", "DN"],
      stat: "₦2.4M",
      statLabel: "Collected this term",
      rows: [
        { name: "Adebayo O.", amt: "₦5,000", paid: true },
        { name: "Chisom F.", amt: "₦5,000", paid: true },
        { name: "Emeka N.", amt: "₦5,000", paid: false },
      ],
    },
    professional: {
      name: "ICAN Lagos Chapter",
      tag: "Professional",
      tagCls: "text-[#7c3aed] bg-[#f3eeff]",
      members: ["JA", "RI", "SO", "TU"],
      stat: "98%",
      statLabel: "Dues compliance rate",
      rows: [
        { name: "John A.", amt: "₦12,000", paid: true },
        { name: "Rita I.", amt: "₦12,000", paid: true },
        { name: "Samuel O.", amt: "₦12,000", paid: false },
      ],
    },
    clubs: {
      name: "Arsenal Club Lagos",
      tag: "Club",
      tagCls: "text-[#059669] bg-[#ecfdf5]",
      members: ["LA", "MK", "NP", "OQ"],
      stat: "₦480k",
      statLabel: "Monthly dues pool",
      rows: [
        { name: "Lawal A.", amt: "₦2,000", paid: true },
        { name: "Musa K.", amt: "₦2,000", paid: false },
        { name: "Ngozi P.", amt: "₦2,000", paid: true },
      ],
    },
    religious: {
      name: "Redeemed Parish G45",
      tag: "Religious",
      tagCls: "text-[#d4a017] bg-[#fff8e7]",
      members: ["PA", "QB", "RC", "SD"],
      stat: "₦1.1M",
      statLabel: "Building fund raised",
      rows: [
        { name: "Pastor A.", amt: "₦10,000", paid: true },
        { name: "Qudus B.", amt: "₦10,000", paid: true },
        { name: "Ruth C.", amt: "₦10,000", paid: false },
      ],
    },
  };
  const m = mocks[variant];
  const avatarClasses = ["bg-[#002FA7]", "bg-[#7c3aed]", "bg-[#059669]", "bg-[#d4a017]"];

  return (
    <div className="w-full h-full bg-[#F5F5F8] rounded-[20px] pt-[18px] px-4 pb-[18px] flex flex-col gap-3 overflow-hidden [font-family:Inter,-apple-system,sans-serif]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-extrabold text-[#0f1d6e]">
            {m.name}
          </div>
          <span
            className={`text-[9px] font-bold rounded-full py-0.5 px-2 mt-[3px] inline-block ${m.tagCls}`}
          >
            {m.tag}
          </span>
        </div>
        <div className="flex">
          {m.members.map((av, i) => (
            <div
              key={i}
              className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-white text-[8px] font-extrabold border-2 border-[#F7F8FC] ${avatarClasses[i % avatarClasses.length]} ${i === 0 ? "ml-0" : "-ml-2"}`}
              style={{ zIndex: m.members.length - i }}
            >
              {av}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-[10px] py-2.5 px-3.5 border border-[#eef0f8] flex items-center justify-between">
        <span className="text-[9px] text-[#6b7280]">{m.statLabel}</span>
        <span className="text-lg font-extrabold text-[#0f1d6e]">
          {m.stat}
        </span>
      </div>
      <div className="bg-white rounded-[10px] border border-[#eef0f8] overflow-hidden flex-1">
        {m.rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-2 px-3 ${i < m.rows.length - 1 ? "border-b border-[#f3f4f8]" : ""}`}
          >
            <span className="text-[11px] text-[#374151] font-medium">
              {row.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#0f1d6e]">
                {row.amt}
              </span>
              <span
                className={`text-[9px] font-bold rounded-full py-0.5 px-[7px] ${row.paid ? "text-[#059669] bg-[#ecfdf5]" : "text-[#e85d04] bg-[#fff4ee]"}`}
              >
                {row.paid ? "Paid" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card icon map — uses your imported images ────────────────────────────────
const CARD_ICONS = {
  schools: iconSchools,
  professional: iconProfessional,
  clubs: iconClubs,
  religious: iconReligious,
};

// ─── Flip card ────────────────────────────────────────────────────────────────
function FlipCard({ title, desc, variant, entryDelay }) {
  const [flipped, setFlipped] = useState(false);
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
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onTouchStart={(e) => { e.preventDefault(); setFlipped((f) => !f); }}
      className="[perspective:1200px] h-[380px] opacity-0"
      style={{
        animation: inView
          ? `ucCardIn 0.7s cubic-bezier(0.22,1,0.36,1) ${entryDelay}ms forwards`
          : "none",
      }}
    >
      <div
        className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"}`}
      >
        {/* ── FRONT ── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-3xl bg-[#F5F5F8] shadow-[0_0_0_1px_rgba(255,255,255,0.75)_inset,0_2px_20px_rgba(28,43,138,0.08)] flex flex-col items-center justify-center gap-3 py-8 px-7 text-center overflow-hidden">
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

        {/* ── BACK ── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl overflow-hidden shadow-[0_0_0_1.5px_#001F6E30_inset,0_8px_40px_rgba(28,43,138,0.14)]">
          <CommunityMock variant={variant} />
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,transparent,#001F6E,transparent)] opacity-60" />
        </div>
      </div>
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
        className="bg-white py-20 md:py-28 relative overflow-hidden"
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
              <FlipCard
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
