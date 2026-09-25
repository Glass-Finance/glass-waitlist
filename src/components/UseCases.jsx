import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import BlurText from "./ui/BlurText";
import { cldUrl, cldSrcSet } from "../lib/cloudinary";
import { goToApp } from "../utils/deviceRedirect";
import { USECASE_PHOTOS } from "./usecasePhotos";

// ─── Carousel geometry ──────────────────────────────────────────────────────
// The caption row repeats the strip widths so its first cell lines up exactly
// under the featured card (the caption box is flex-1, spacers mirror strips).
const GAP = "gap-2.5 md:gap-4";
const STRIP =
  "hidden md:block shrink-0 transition-[filter] duration-200 hover:brightness-110 motion-reduce:transition-none";
const STRIP_W = [152, 96, 56];
const CARD_H = "h-[340px] md:h-[420px]";

const TICK_MS = 4500;
const SLIDE_MS = 650;
const PHOTO_WIDTHS = [640, 960, 1280, 1600];
const STRIP_SRC_W = [320, 640, 960];
const PHOTO_QUALITY = "auto:best";
const PHOTO_SIZES = "(max-width: 768px) calc(100vw - 48px), 732px";
const STRIP_SIZES = "152px";
const WARM_TIMEOUT_MS = 3000;
const SLIDE_EASE = [0.22, 1, 0.36, 1];

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

// Fisher-Yates — each mount sees the category pools in a fresh random order.
function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickWidth() {
  const dpr = window.devicePixelRatio || 1;
  const cssW = window.innerWidth <= 768 ? window.innerWidth - 48 : 732;
  const need = Math.min(Math.ceil(cssW * dpr), 1600);
  return PHOTO_WIDTHS.find((w) => w >= need) ?? 1600;
}

export default function UseCases() {
  const [step, setStep] = useState(0);
  // `displayed` is the row actually on screen; it lags `step` until the new
  // row's featured photo is fetched+decoded, so the slide never shows a blank.
  const [displayed, setDisplayed] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const sectionRef = useRef(null);
  const warmRef = useRef(new Set());
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const queues = useMemo(
    () => Object.fromEntries(cases.map((c) => [c.variant, shuffle(USECASE_PHOTOS[c.variant])])),
    [],
  );

  // Rounds loop: every category shows one photo per round —
  // step 0..3 = photo #1 of each category, step 4..7 = photo #2, ...
  const photoAt = useCallback(
    (s) => {
      const caseIdx = s % cases.length;
      const round = Math.floor(s / cases.length);
      const pool = queues[cases[caseIdx].variant];
      return { caseIdx, round, photo: pool[round % pool.length] };
    },
    [queues],
  );

  // Steps are one full round apart per strip: strip k advances `delta` steps.
  const deltaFor = useCallback((rowStep, k) => {
    const activeIdx = rowStep % cases.length;
    return (k - activeIdx + cases.length) % cases.length || cases.length;
  }, []);

  // Warm the exact resource the <img> will select (same srcset + sizes), so
  // decode() finishes before we start the slide.
  const warm = useCallback((pid, mode) => {
    const key = `${mode}:${pid}`;
    if (warmRef.current.has(key)) return Promise.resolve();
    warmRef.current.add(key);
    const featured = mode === "featured";
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(resolve, WARM_TIMEOUT_MS);
      const settle = () => {
        clearTimeout(timer);
        resolve(pid);
      };
      img.sizes = featured ? PHOTO_SIZES : STRIP_SIZES;
      img.srcset = cldSrcSet(pid, featured ? PHOTO_WIDTHS : STRIP_SRC_W, {
        quality: PHOTO_QUALITY,
      });
      img.src = cldUrl(pid, {
        width: featured ? pickWidth() : 640,
        quality: PHOTO_QUALITY,
      });
      if (img.decode) img.decode().then(settle, settle);
      else img.onload = settle;
      img.onerror = settle;
    });
  }, []);

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

  // Commit a new row only once its featured photo decoded (never a blank
  // frame), while preloading that row's three strip panels in parallel.
  useEffect(() => {
    if (displayed && displayed.step === step) return;
    let alive = true;
    const target = photoAt(step);
    warm(target.photo.publicId, "featured").then(() => {
      if (alive) setDisplayed({ ...target.photo, step });
    });
    // Next tick's featured photo starts fetching now, so the following slide
    // begins instantly instead of waiting on the network.
    warm(photoAt(step + 1).photo.publicId, "featured");
    for (let d = 1; d < cases.length; d++) warm(photoAt(step + d).photo.publicId, "strip");
    return () => {
      alive = false;
    };
  }, [step, displayed, photoAt, warm]);

  // Autoplay: one rhythm — every tick slides to the next category (and a new
  // photo for a category once per full round). Runs while in view regardless
  // of hover (Stripe-like: it keeps scrolling), never under reduced motion,
  // never in a background tab, paused while keyboard-focused.
  const playing = inView && !focused && !tabHidden && !reduce;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => s + 1), TICK_MS);
    return () => clearInterval(id);
  }, [playing]);

  const enter = `uc-enter ${revealed ? "uc-in" : ""}`;
  const shown = displayed ?? { ...photoAt(0).photo, step: 0 };

  // Strips show the rest of the queue in order: next-up first (3 strips —
  // the active category is the featured card, not a strip).
  const queue = Array.from(
    { length: cases.length - 1 },
    (_, k) => (shown.step + k + 1) % cases.length,
  );
  const go = (delta) => setStep((s) => s + delta);

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
        {/* ── Header — centered, original sizing (uniform with other sections) ── */}
        <div className={`${enter} text-center mb-14`} style={{ animationDelay: "0ms" }}>
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full">
              Use Cases
            </span>
          </div>
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
          <div className="flex justify-center">
            <p className="text-[clamp(15px,2vw,17px)] text-black/60 max-w-[700px] leading-[1.7] text-center">
              Whether you run a small club or a national association, Glass scales with you.
            </p>
          </div>
        </div>

        {/* ── Visual row — slides left on every change (old row exits left,
            new row enters from the right, Stripe-style) ── */}
        <div
          className={`${enter} relative overflow-hidden ${CARD_H}`}
          style={{ animationDelay: "120ms" }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Use cases"
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={shown.step}
              className={`absolute inset-0 flex ${GAP}`}
              initial={{ x: reduce ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : "-100%" }}
              transition={{ duration: reduce ? 0 : SLIDE_MS / 1000, ease: SLIDE_EASE }}
            >
              <div className="relative flex-1 min-w-0 overflow-hidden rounded-sm bg-white shadow-[0_0_0_1px_rgba(28,43,138,0.06),0_4px_24px_rgba(28,43,138,0.08)]">
                <img
                  data-featured
                  src={cldUrl(shown.publicId, {
                    width: pickWidth(),
                    quality: PHOTO_QUALITY,
                  })}
                  srcSet={cldSrcSet(shown.publicId, PHOTO_WIDTHS, {
                    quality: PHOTO_QUALITY,
                  })}
                  sizes={PHOTO_SIZES}
                  alt={shown.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {queue.map((k, i) => {
                const c = cases[k];
                const stripPhoto = photoAt(shown.step + deltaFor(shown.step, k)).photo;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      if (e.detail > 0) e.currentTarget.blur();
                      go(deltaFor(shown.step, k));
                    }}
                    aria-label={`Show ${c.title}`}
                    style={{ width: STRIP_W[i] }}
                    className={`${STRIP} relative overflow-hidden rounded-sm bg-[#F5F7FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#002FA7]/60`}
                  >
                    <img
                      src={cldUrl(stripPhoto.publicId, { width: 640, quality: PHOTO_QUALITY })}
                      srcSet={cldSrcSet(stripPhoto.publicId, STRIP_SRC_W, {
                        quality: PHOTO_QUALITY,
                      })}
                      sizes={`${STRIP_W[i]}px`}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Caption — mirrors the row above so it sits under the featured card ── */}
        <div className={`${enter} flex ${GAP} mt-5 md:mt-7`} style={{ animationDelay: "240ms" }}>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="min-w-0" aria-live="polite">
              <AnimatePresence initial={false}>
                <motion.div
                  key={shown.step}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
                >
                  <h3 className="text-[clamp(19px,2.2vw,24px)] font-bold text-[#0f1d6e] leading-snug">
                    {cases[shown.step % cases.length].title}
                  </h3>
                  <p className="mt-1.5 text-[15px] md:text-[16px] text-[#9099b2] leading-[1.6] max-w-[560px]">
                    {cases[shown.step % cases.length].body}
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
          {queue.map((_, i) => (
            <div key={i} aria-hidden className={STRIP} style={{ width: STRIP_W[i] }} />
          ))}
        </div>
      </div>
    </section>
  );
}
