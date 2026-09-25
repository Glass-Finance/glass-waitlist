import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import BlurText from "./ui/BlurText";
import { cldUrl, cldSrcSet } from "../lib/cloudinary";
import { goToApp } from "../utils/deviceRedirect";
import { USECASE_PHOTOS } from "./usecasePhotos";

// ─── Strip icons — Cloudinary public ids (see docs/cloudinary.md) ────────────
const ICON_WIDTHS = [72, 144, 216];
const stripIcons = {
  schools: {
    src: cldUrl("glass/usecase/icon-schools", { width: 150 }),
    srcSet: cldSrcSet("glass/usecase/icon-schools", ICON_WIDTHS),
  },
  professional: {
    src: cldUrl("glass/usecase/icon-professional", { width: 150 }),
    srcSet: cldSrcSet("glass/usecase/icon-professional", ICON_WIDTHS),
  },
  clubs: {
    src: cldUrl("glass/usecase/icon-clubs", { width: 150 }),
    srcSet: cldSrcSet("glass/usecase/icon-clubs", ICON_WIDTHS),
  },
  religious: {
    src: cldUrl("glass/usecase/icon-religious", { width: 150 }),
    srcSet: cldSrcSet("glass/usecase/icon-religious", ICON_WIDTHS),
  },
};

// ─── Carousel geometry ──────────────────────────────────────────────────────
// The caption row repeats these constants so its first cell lines up exactly
// under the featured card (the caption box is flex-1, spacers mirror strips).
const GAP = "gap-2.5 md:gap-4";
const STRIP = "hidden md:block w-[104px] shrink-0";
const CARD_H = "h-[340px] md:h-[420px]";

const TICK_MS = 4500;
const PHOTO_WIDTHS = [640, 960, 1280, 1600];
const PHOTO_QUALITY = "auto:best";
const PHOTO_SIZES = "(max-width: 768px) calc(100vw - 48px), 732px";

const TINT = {
  schools: "from-[#EAF1FF] to-[#DAE6FF]",
  professional: "from-[#EEF0FF] to-[#E2E6FF]",
  clubs: "from-[#E7F6F2] to-[#D4EFE7]",
  religious: "from-[#FFF3E4] to-[#FFEBD2]",
};

const cases = [
  {
    title: "Schools & Alumni",
    body: "One payment link for school fees, PTA levies and alumni dues — parents pay from any bank and your bursar sees every payment land live.",
    variant: "schools",
  },
  {
    title: "Professional Bodies",
    body: "Members pay dues and certification fees in seconds, with automatic reminders and receipts handled for them.",
    variant: "professional",
  },
  {
    title: "Clubs & Associations",
    body: "Monthly dues, event fees and levies in one place — nudge anyone outstanding with a single tap.",
    variant: "clubs",
  },
  {
    title: "Religious Organizations",
    body: "Tithes, offerings and pledges recorded as they arrive, giving your leadership a clear shared record.",
    variant: "religious",
  },
];

// Fisher-Yates — each mount sees the category pools in a fresh random order
// (the carousel still cycles every photo, just never in the same sequence).
function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const INITIAL_CURSORS = Object.fromEntries(cases.map((c) => [c.variant, 0]));

export default function UseCases() {
  const [slide, setSlide] = useState({ active: 0, seq: 0, cursors: INITIAL_CURSORS });
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const queues = useMemo(
    () => Object.fromEntries(cases.map((c) => [c.variant, shuffle(USECASE_PHOTOS[c.variant])])),
    [],
  );

  // Entrance reveal (one-shot) + live in-view flag for autoplay gating.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Autoplay: one rhythm — every tick advances the active category AND that
  // category's photo cursor together. Runs only while the section is in view
  // and not hovered/focused, never under reduced motion, never in a
  // background tab.
  const playing = inView && !hovered && !focused && !tabHidden && !reduce;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setSlide((s) => {
        const active = (s.active + 1) % cases.length;
        const variant = cases[active].variant;
        const cursors = {
          ...s.cursors,
          [variant]: (s.cursors[variant] + 1) % queues[variant].length,
        };
        return { active, seq: s.seq + 1, cursors };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [playing, queues]);

  const current = cases[slide.active];
  const photo = queues[current.variant][slide.cursors[current.variant]];
  // Strips show the rest of the queue in order: next-up first.
  const queue = cases.map((_, k) => cases[(slide.active + k + 1) % cases.length]);
  const go = (idx) => setSlide((s) => ({ ...s, active: idx, seq: s.seq + 1 }));
  const enter = `uc-enter ${revealed ? "uc-in" : ""}`;

  // Warm the next tick's photo so the crossfade never shows a blank frame.
  useEffect(() => {
    const nextCase = cases[(slide.active + 1) % cases.length];
    const pool = queues[nextCase.variant];
    const nextPhoto = pool[(slide.cursors[nextCase.variant] + 1) % pool.length];
    const img = new Image();
    img.src = cldUrl(nextPhoto.publicId, { width: 1600, quality: PHOTO_QUALITY });
  }, [slide, queues]);

  // Pause on keyboard focus anywhere in the section.
  const handleFocus = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setFocused(true);
  };
  const handleBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setFocused(false);
  };

  return (
    <section
      ref={sectionRef}
      id="use-cases"
      className="py-20 md:py-28 relative isolate overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <style>{`
        @keyframes ucEnter {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .uc-enter { opacity: 0; }
        .uc-in { animation: ucEnter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .uc-enter, .uc-in { animation: none; }
          .uc-enter { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="max-w-[1140px] mx-auto px-6 relative z-10">
        {/* ── Header ── */}
        <div className={`${enter} mb-7 md:mb-9`} style={{ animationDelay: "0ms" }}>
          <div className="min-w-0">
            <h2 className="text-[clamp(26px,4.4vw,44px)] font-bold text-[#0f1d6e] leading-[1.15] tracking-[-0.02em]">
              <BlurText
                text="Built for every Nigerian community"
                animateBy="words"
                direction="top"
                delay={65}
                stepDuration={0.42}
              />
            </h2>
            <p className="mt-3 text-[clamp(15px,2vw,17px)] text-[#9099b2] leading-[1.65] max-w-[640px]">
              Whether you run a small club or a national association, Glass scales with you.
            </p>
          </div>
        </div>

        {/* ── Visual row — featured photo + peeking strips ── */}
        <div
          className={`${enter} flex ${GAP} ${CARD_H}`}
          style={{ animationDelay: "120ms" }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Use cases"
        >
          <div className="relative flex-1 min-w-0 overflow-hidden rounded-3xl bg-white shadow-[0_0_0_1px_rgba(28,43,138,0.06),0_4px_24px_rgba(28,43,138,0.08)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={slide.seq}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.45, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img
                  src={cldUrl(photo.publicId, { width: 1600, quality: PHOTO_QUALITY })}
                  srcSet={cldSrcSet(photo.publicId, PHOTO_WIDTHS, { quality: PHOTO_QUALITY })}
                  sizes={PHOTO_SIZES}
                  alt={photo.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {queue.map((c) => (
            <button
              key={c.title}
              type="button"
              onClick={() => go(cases.indexOf(c))}
              aria-label={`Show ${c.title}`}
              className={`${STRIP} group relative overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#002FA7]/60`}
            >
              <span className={`absolute inset-0 bg-gradient-to-br ${TINT[c.variant]}`} />
              <img
                src={stripIcons[c.variant].src}
                srcSet={stripIcons[c.variant].srcSet}
                sizes="104px"
                alt=""
                className="relative w-9 md:w-11 h-auto transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>

        {/* ── Caption — mirrors the row above so it sits under the featured card ── */}
        <div className={`${enter} flex ${GAP} mt-5 md:mt-7`} style={{ animationDelay: "240ms" }}>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="min-w-0" aria-live="polite">
              <AnimatePresence initial={false}>
                <motion.div
                  key={slide.seq}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
                >
                  <h3 className="text-[clamp(19px,2.2vw,24px)] font-bold text-[#0f1d6e] leading-snug">
                    {current.title}
                  </h3>
                  <p className="mt-1.5 text-[15px] md:text-[16px] text-[#9099b2] leading-[1.6] max-w-[560px]">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => goToApp("/sign-up", navigate)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#002FA7]/25 bg-white px-5 py-2.5 text-[14px] font-semibold text-[#002FA7] transition-colors hover:bg-[#002FA7] hover:border-[#002FA7] hover:text-white motion-reduce:transition-none"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {queue.map((c) => (
            <div key={c.title} aria-hidden className={STRIP} />
          ))}
        </div>
      </div>
    </section>
  );
}
