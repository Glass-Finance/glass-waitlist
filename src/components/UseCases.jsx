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
  "hidden md:block shrink-0 transition-[width] duration-500 ease-out motion-reduce:transition-none";
const STRIP_W = [152, 96, 56];
const CARD_H = "h-[340px] md:h-[420px]";

const TICK_MS = 4500;
const PHOTO_WIDTHS = [640, 960, 1280, 1600];
const STRIP_SRC_W = [320, 640, 960];
const PHOTO_QUALITY = "auto:best";
const PHOTO_SIZES = "(max-width: 768px) calc(100vw - 48px), 732px";
const PROX_RADIUS = 180;
const PROX_SCALE = 0.045;
const PROX_BRIGHTNESS = 0.12;
const WARM_TIMEOUT_MS = 3000;

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
  // `displayed` lags `step` until the target photo is fetched+decoded, so a
  // slide only swaps when its image is already there — never a blank frame.
  const [displayed, setDisplayed] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const sectionRef = useRef(null);
  const stripImgRefs = useRef([]);
  const posRef = useRef({ x: -9999, y: -9999 });
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

  const warm = useCallback((pid) => {
    if (!pid || warmRef.current.has(pid)) return Promise.resolve();
    warmRef.current.add(pid);
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(resolve, WARM_TIMEOUT_MS);
      const settle = () => {
        clearTimeout(timer);
        resolve(pid);
      };
      img.sizes = PHOTO_SIZES;
      img.srcset = cldSrcSet(pid, PHOTO_WIDTHS, { quality: PHOTO_QUALITY });
      img.src = cldUrl(pid, { width: pickWidth(), quality: PHOTO_QUALITY });
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

  // First slide is warmed immediately; everything else while in view. On each
  // step, warm the current photo plus the whole next round (+1) so upcoming
  // swaps hit cache — the featured <img> never waits on the network.
  useEffect(() => {
    if (!inView) return;
    let alive = true;
    const target = photoAt(step);
    warm(target.photo.publicId).then(() => {
      if (alive) setDisplayed({ ...target.photo, step });
    });
    for (let d = 1; d <= cases.length; d++) warm(photoAt(step + d).photo.publicId);
    return () => {
      alive = false;
    };
  }, [step, inView, photoAt, warm]);

  useEffect(() => {
    const first = photoAt(0);
    warm(first.photo.publicId).then(() => {
      setDisplayed((d) => d ?? { ...first.photo, step: 0 });
    });
  }, [photoAt, warm]);

  // Autoplay: one rhythm — every tick advances a step (next category, and a
  // new photo for a category once per full round). Runs only while in view
  // and not hovered/focused, never under reduced motion, never in a
  // background tab.
  const playing = inView && !hovered && !focused && !tabHidden && !reduce;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => s + 1), TICK_MS);
    return () => clearInterval(id);
  }, [playing]);

  const activeIdx = step % cases.length;
  const stripStep = (k) => {
    const delta = (k - activeIdx + cases.length) % cases.length || cases.length;
    return step + delta;
  };
  // Strips show the rest of the queue in order: next-up first (3 strips —
  // the active category is the featured card, not a strip).
  const queue = Array.from(
    { length: cases.length - 1 },
    (_, k) => (activeIdx + k + 1) % cases.length,
  );
  const go = (k) => setStep(stripStep(k));
  const enter = `uc-enter ${revealed ? "uc-in" : ""}`;
  const shown = displayed ?? { ...photoAt(0).photo, step: 0 };
  const shownCase = cases[shown.step % cases.length];

  // ── Proximity: gaussian falloff from the cursor to each strip photo ──────
  // (same math as ui/VariableProximity — distance/radius + gaussian — but
  // interpolating scale/brightness on the <img> instead of font axes).
  useEffect(() => {
    if (reduce) return;
    let frameId;
    const loop = () => {
      const section = sectionRef.current;
      if (section) {
        const secRect = section.getBoundingClientRect();
        const { x, y } = posRef.current;
        stripImgRefs.current.forEach((el) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (!rect.width) return;
          const cx = rect.left + rect.width / 2 - secRect.left;
          const cy = rect.top + rect.height / 2 - secRect.top;
          const dist = Math.hypot(x - cx, y - cy);
          const v = dist >= PROX_RADIUS ? 0 : Math.exp(-((dist / (PROX_RADIUS / 2)) ** 2) / 2);
          el.style.transform = v ? `scale(${1 + PROX_SCALE * v})` : "";
          el.style.filter = v ? `brightness(${1 + PROX_BRIGHTNESS * v})` : "";
        });
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [reduce]);

  const trackPointer = (clientX, clientY) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    posRef.current = { x: clientX - rect.left, y: clientY - rect.top };
  };
  const handleMouseMove = (e) => trackPointer(e.clientX, e.clientY);
  const handleTouchMove = (e) => {
    const t = e.touches[0];
    if (t) trackPointer(t.clientX, t.clientY);
  };

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
      onMouseLeave={() => {
        setHovered(false);
        posRef.current = { x: -9999, y: -9999 };
      }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
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

        {/* ── Visual row — featured photo + receding photo strips ── */}
        <div
          className={`${enter} flex ${GAP} ${CARD_H}`}
          style={{ animationDelay: "120ms" }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Use cases"
        >
          <div className="relative flex-1 min-w-0 overflow-hidden rounded-sm bg-white shadow-[0_0_0_1px_rgba(28,43,138,0.06),0_4px_24px_rgba(28,43,138,0.08)]">
            <img
              data-featured
              src={cldUrl(shown.publicId, { width: pickWidth(), quality: PHOTO_QUALITY })}
              srcSet={cldSrcSet(shown.publicId, PHOTO_WIDTHS, { quality: PHOTO_QUALITY })}
              sizes={PHOTO_SIZES}
              alt={shown.alt}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {queue.map((k, i) => {
            const c = cases[k];
            const stripPhoto = photoAt(stripStep(k)).photo;
            return (
              <button
                key={i}
                type="button"
                onClick={() => go(k)}
                aria-label={`Show ${c.title}`}
                style={{ width: STRIP_W[i] }}
                className={`${STRIP} group relative overflow-hidden rounded-sm bg-[#F5F7FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#002FA7]/60`}
              >
                <img
                  ref={(el) => {
                    stripImgRefs.current[i] = el;
                  }}
                  src={cldUrl(stripPhoto.publicId, { width: 640, quality: PHOTO_QUALITY })}
                  srcSet={cldSrcSet(stripPhoto.publicId, STRIP_SRC_W, {
                    quality: PHOTO_QUALITY,
                  })}
                  sizes={`${STRIP_W[i]}px`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover will-change-transform"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
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
                    {shownCase.title}
                  </h3>
                  <p className="mt-1.5 text-[15px] md:text-[16px] text-[#9099b2] leading-[1.6] max-w-[560px]">
                    {shownCase.body}
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
