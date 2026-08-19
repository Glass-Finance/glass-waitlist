import { useEffect, useRef, useState } from "react";

// Positions/sizes/colors/stagger straight from the design handoff (see
// design_handoff_checkmark_animation/README.md) -- not arbitrary, keep in
// sync with that spec if it ever changes.
const ACCENTS = [
  { glyph: "★", x: 92, y: 2, size: 14, color: "oklch(0.5 0.15 145)" },
  { glyph: "●", x: 12, y: 54, size: 8, color: "oklch(0.78 0.1 145)" },
  { glyph: "●", x: 170, y: 48, size: 8, color: "oklch(0.5 0.15 145)" },
  { glyph: "★", x: 14, y: 108, size: 12, color: "oklch(0.5 0.15 145)" },
  { glyph: "★", x: 150, y: 138, size: 10, color: "oklch(0.78 0.1 145)" },
  { glyph: "●", x: 90, y: 174, size: 7, color: "oklch(0.5 0.15 145)" },
];
const ACCENT_STAGGER = 0.08;
const CHECK_DASH = 60;

// Animated success badge, reused wherever the app shows a "success"
// confirmation (email verified, phone verified, email updated, transaction
// successful, ...) instead of a static checkmark. Sequence: badge rises +
// pops in -> checkmark draws itself like it's being written -> decorative
// stars/dots pop out around it -> message text fades up. Everything is
// timed off one `badgeDelay` (an initial pause before anything starts,
// e.g. while a network call finishes) -- see
// design_handoff_checkmark_animation/README.md for the full spec this is
// ported pixel/timing-for-timing from.
export default function SuccessBadge({ message, subMessage, badgeDelay = 0.1, className = "" }) {
  const [checkOffset, setCheckOffset] = useState(CHECK_DASH);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const checkStartMs = badgeDelay * 1000 + 550;
    timeoutRef.current = setTimeout(() => {
      const start = performance.now();
      const dur = 380;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setCheckOffset(CHECK_DASH * (1 - eased));
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, checkStartMs);
    return () => {
      clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [badgeDelay]);

  const accentStart = badgeDelay + 0.95;
  const textDelay = accentStart + ACCENTS.length * ACCENT_STAGGER + 0.15;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 130,
            height: 130,
            top: "50%",
            left: "50%",
            background: "oklch(0.6 0.18 145)",
            opacity: 0,
            animation: `successRingPulse 1.8s ease-out ${badgeDelay + 0.5}s both`,
          }}
        />

        {ACCENTS.map((a, i) => (
          <div
            key={i}
            className="absolute leading-none"
            style={{
              left: a.x,
              top: a.y,
              fontSize: a.size,
              color: a.color,
              transformOrigin: "center",
              opacity: 0,
              animation: `successAccentPop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${accentStart + i * ACCENT_STAGGER}s both`,
            }}
          >
            {a.glyph}
          </div>
        ))}

        <div
          className="absolute"
          style={{
            width: 112,
            height: 112,
            top: "50%",
            left: "50%",
            opacity: 0,
            animation: `successBadgePop 0.65s cubic-bezier(0.34,1.56,0.64,1) ${badgeDelay}s both`,
          }}
        >
          {/* Corner-softening per the design spec's fallback option: a
              blur+alpha-threshold ("goo") SVG filter renders the scallop
              fine as a static shape, but combined with this element's own
              scale/opacity animation it intermittently vanishes entirely
              (filter compositing during a live transform is a known rough
              edge across renderers) -- a rounded stroke on the same path
              is a plain fill, so it can't have that failure mode, and
              still knocks the sharp scallop points down to a smooth
              blob. */}
          <svg width="112" height="112" viewBox="0 0 24 24" style={{ display: "block" }}>
            <path
              d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72 3.1 5.53l.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12z"
              fill="#008000"
              stroke="#008000"
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <svg
            width="50"
            height="39"
            viewBox="0 0 44 34"
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
          >
            <path
              d="M4 17 L17 29 L40 4"
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CHECK_DASH}
              strokeDashoffset={checkOffset}
            />
          </svg>
        </div>
      </div>

      <div
        className="mt-7 text-center"
        style={{
          fontSize: 20,
          color: "oklch(0.25 0.01 275)",
          opacity: 0,
          animation: `successTextFade 0.5s ease-out ${textDelay}s both`,
        }}
      >
        {message}
      </div>
      {subMessage && (
        <div
          className="mt-2 text-center max-w-[300px]"
          style={{
            fontSize: 14,
            color: "oklch(0.5 0.01 275)",
            opacity: 0,
            animation: `successTextFade 0.5s ease-out ${textDelay}s both`,
          }}
        >
          {subMessage}
        </div>
      )}
    </div>
  );
}
