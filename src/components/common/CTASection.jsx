/**
 * Shared closing CTA section used by both the organizations and members
 * marketing pages. Icon layout/entrance animation is identical between
 * them; only copy, click target, and button hover style vary — see
 * organizations/CTA.jsx and members/MembersCTA.jsx for the per-audience
 * data. buttonHoverVariant "magnetic" (org) follows the cursor on hover;
 * "lift" (members) is a simpler translateY.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import BlurText from "../ui/BlurText";

import icon1 from "../../assets/cta/icon1.webp";
import icon2 from "../../assets/cta/icon2.webp";
import icon3 from "../../assets/cta/icon3.webp";
import icon4 from "../../assets/cta/icon4.webp";
import icon5 from "../../assets/cta/icon5.webp";
import icon6 from "../../assets/cta/icon6.webp";
import logo from "../../assets/cta/ctalogo.webp";

/* ─── Icon layout config ───────────────────────────────────────────── */
const icons = [
  /* ── LEFT SIDE ── */
  {
    id: "soccer",
    src: icon1,
    /* top-left — further out */
    style: { top: "8%", left: "4.5%" },
    size: 62,
    delay: 0,
    floatAmp: 7,
    floatPeriod: 3400,
    entranceFrom: { x: -32, y: -14 },
  },
  {
    id: "hoop",
    src: icon2,
    /* mid-left — CLOSER to text */
    style: { top: "50%", left: "11%", transform: "translateY(-50%)" },
    size: 66,
    delay: 0.5,
    floatAmp: 8,
    floatPeriod: 3100,
    entranceFrom: { x: -28, y: 0 },
  },
  {
    id: "people",
    src: icon3,
    /* bottom-left — further out */
    style: { bottom: "8%", left: "4.5%" },
    size: 60,
    delay: 1.0,
    floatAmp: 6,
    floatPeriod: 3700,
    entranceFrom: { x: -32, y: 14 },
  },

  /* ── RIGHT SIDE ── */
  {
    id: "bible",
    src: icon4,
    /* top-right — further out */
    style: { top: "8%", right: "4.5%" },
    size: 62,
    delay: 0.25,
    floatAmp: 7,
    floatPeriod: 3200,
    entranceFrom: { x: 32, y: -14 },
  },
  {
    id: "runner",
    src: icon5,
    /* mid-right — CLOSER to text */
    style: { top: "50%", right: "11%", transform: "translateY(-50%)" },
    size: 66,
    delay: 0.75,
    floatAmp: 8,
    floatPeriod: 2900,
    entranceFrom: { x: 28, y: 0 },
  },
  {
    id: "grad",
    src: icon6,
    /* bottom-right — further out */
    style: { bottom: "8%", right: "4.5%" },
    size: 60,
    delay: 1.25,
    floatAmp: 6,
    floatPeriod: 3500,
    entranceFrom: { x: 32, y: 14 },
  },
];

/* ─── FloatingIcon ─────────────────────────────────────────────────── */
function FloatingIcon({ icon, inView }) {
  const elRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!inView || !elRef.current) return;
    const el = elRef.current;

    /* Entrance: slide in from edge, spring easing */
    el.style.transition = "none";
    el.style.transform = `${icon.style.transform || ""} translate(${icon.entranceFrom.x}px, ${icon.entranceFrom.y}px) scale(0.84)`;

    const entranceDelay = icon.delay * 1000 + 100;

    const t1 = setTimeout(() => {
      el.style.transition = `transform 0.75s cubic-bezier(0.22,1,0.36,1)`;
      el.style.transform = `${icon.style.transform || ""} translate(0,0) scale(1)`;
    }, entranceDelay);

    /* Float loop starts after entrance settles */
    const t2 = setTimeout(() => {
      el.style.transition = "none";
      startRef.current = null;

      const loop = (ts) => {
        if (!startRef.current) startRef.current = ts;
        const elapsed = (ts - startRef.current) / icon.floatPeriod;
        const dy = Math.sin(elapsed * Math.PI * 2) * icon.floatAmp;

        /* Preserve the original transform (e.g. translateY(-50%)) + add float */
        if (icon.style.transform?.includes("translateY(-50%)")) {
          el.style.transform = `translateY(calc(-50% + ${dy.toFixed(2)}px)) scale(1)`;
        } else {
          el.style.transform = `translate(0, ${dy.toFixed(2)}px) scale(1)`;
        }

        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }, entranceDelay + 820);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [inView]);

  /* Build position style without transform (handled by JS) */
  const { transform: _omit, ...posStyle } = icon.style;

  return (
    <div
      className="absolute z-[2] will-change-transform"
      style={{
        width: `clamp(30px, 8vw, ${icon.size}px)`,
        height: `clamp(30px, 8vw, ${icon.size}px)`,
        ...posStyle,
        /* initial state — invisible until entrance fires */
        transform: `${icon.style.transform || ""} translate(${icon.entranceFrom.x}px, ${icon.entranceFrom.y}px) scale(0.84)`,
      }}
      ref={elRef}
    >
      <img
        src={icon.src}
        alt=""
        draggable={false}
        className="w-full h-full object-contain block"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ─── CTASection ───────────────────────────────────────────────────── */
export default function CTASection({
  headline,
  subtext,
  buttonLabel,
  onButtonClick,
  buttonHoverVariant = "magnetic",
}) {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const btnRef = useRef(null);
  const [inView, setInView] = useState(false);

  /* Section enters viewport */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Card drops in */
  useEffect(() => {
    if (!inView || !cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = "translateY(44px)";
    card.style.transition = "transform 0.85s cubic-bezier(0.22,1,0.36,1)";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        card.style.transform = "translateY(0)";
      }),
    );
  }, [inView]);

  /* Button bounces in */
  useEffect(() => {
    if (!inView || !btnRef.current) return;
    const btn = btnRef.current;
    btn.style.transform = "scale(0.88)";
    btn.style.transition =
      "transform 0.65s cubic-bezier(0.34,1.56,0.64,1) 700ms";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        btn.style.transform = "scale(1)";
      }),
    );

    // after the bounce finishes, clear the slow transition so hover can
    // take over instantly
    const t = setTimeout(() => {
      if (btnRef.current) {
        btnRef.current.style.transition =
          "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease";
      }
    }, 1500);

    return () => clearTimeout(t);
  }, [inView]);

  const magnetic = buttonHoverVariant === "magnetic";

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#F7F8FC] py-14 px-6 overflow-hidden"
    >
      <div
        ref={cardRef}
        className="max-w-[1140px] mx-auto rounded-3xl overflow-hidden relative bg-[#0d1a6e] text-center min-h-[300px] flex flex-col items-center justify-center [padding:clamp(40px,7vw,88px)_clamp(24px,10vw,200px)]"
      >
        {/* ── Floating icons ── */}
        {icons.map((icon) => (
          <FloatingIcon key={icon.id} icon={icon} inView={inView} />
        ))}

        {/* ── Glass logo ── */}
        <div className="mb-[18px] relative z-[5]">
          <img
            src={logo}
            alt="Glass"
            className="w-[34px] h-[34px] object-contain opacity-[0.88]"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* ── Headline ── */}
        <h2 className="text-[clamp(24px,4.5vw,52px)] font-extrabold text-white leading-[1.1] tracking-[-0.02em] max-w-[580px] mb-3.5 relative z-[5]">
          <BlurText
            text={headline}
            animateBy="words"
            direction="top"
            delay={55}
            stepDuration={0.4}
            centered
          />
        </h2>

        {/* ── Subtext ── */}
        <p className="text-[clamp(13px,3vw,16px)] text-white/52 mb-9 leading-[1.6] relative z-[5]">
          {subtext}
        </p>

        {/* ── Button ── */}
        {magnetic ? (
          <button
            ref={btnRef}
            onClick={onButtonClick}
            className="inline-flex items-center gap-2 bg-white text-[#0d1a6e] font-semibold rounded-full border-none cursor-pointer relative z-[5] [font-size:clamp(12px,3.5vw,15px)] [padding:clamp(10px,2.5vw,14px)_clamp(16px,5vw,32px)]"
            style={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              transition:
                "transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease",
            }}
            onMouseMove={(e) => {
              const btn = e.currentTarget;
              const r = btn.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const dx = ((e.clientX - cx) / (r.width / 2)) * 10;
              const dy = ((e.clientY - cy) / (r.height / 2)) * 6;
              btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(1.04)`;
              btn.style.boxShadow =
                "0 14px 40px rgba(0,0,0,0.35), 0 0 0 3px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translate(0,0) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
            }}
          >
            {buttonLabel}
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex items-center"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </button>
        ) : (
          <button
            ref={btnRef}
            onClick={onButtonClick}
            className="inline-flex items-center gap-2 bg-white text-[#0d1a6e] text-[15px] font-semibold py-3.5 px-8 rounded-full border-none cursor-pointer relative z-[5]"
            style={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-4px) scale(1.03)";
              e.currentTarget.style.boxShadow =
                "0 14px 40px rgba(0,0,0,0.35), 0 0 0 3px rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
            }}
          >
            {buttonLabel}
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </button>
        )}
      </div>
    </section>
  );
}
