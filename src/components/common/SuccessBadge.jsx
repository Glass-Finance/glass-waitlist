import sealSrc from "../../assets/dashboard/feedback/success-seal.png";
import accentTopStar from "../../assets/dashboard/feedback/success-accent-0.png";
import accentLeftStar from "../../assets/dashboard/feedback/success-accent-1.png";
import accentRightStar from "../../assets/dashboard/feedback/success-accent-2.png";
import accentBottomDot from "../../assets/dashboard/feedback/success-accent-3.png";
import accentRightDot from "../../assets/dashboard/feedback/success-accent-4.png";
import accentLeftDot from "../../assets/dashboard/feedback/success-accent-5.png";

// Every number below is measured off the design source (Glass Design by
// AQ/FeedbackIcon/Success.png, 540x483): seal bbox, the white check's
// centerline + stroke width (IoU fit against the cutout's alpha mask), and
// each accent's bounding box — not hand-tuned, keep in sync if that asset
// ever changes. SCALE maps design px onto the 112px seal footprint the
// previous hand-built SVG used, so all 14 call sites keep their layout.
const SEAL_PX = 112;
const DESIGN = {
  seal: { x: 111, y: 97, w: 318, h: 319, cx: 269.5, cy: 256 },
  check: { d: "M211 259 L265 305 L318 207", strokeWidth: 36 },
  // In draw-pop order: top star, left dot, right dot, left star,
  // right star, bottom dot (matches the handoff's original stagger).
  accents: [
    { src: accentTopStar, x: 241, y: 11, w: 56, h: 54 },
    { src: accentLeftDot, x: 10, y: 140, w: 28, h: 29 },
    { src: accentRightDot, x: 496, y: 215, w: 28, h: 29 },
    { src: accentLeftStar, x: 22, y: 338, w: 40, h: 38 },
    { src: accentRightStar, x: 496, y: 359, w: 40, h: 38 },
    { src: accentBottomDot, x: 187, y: 443, w: 28, h: 29 },
  ],
};
const SCALE = SEAL_PX / DESIGN.seal.w;
// Design point -> 200x200 container coords, with the seal centered at
// (100,100) exactly where the old implementation put it.
const OX = 100 - DESIGN.seal.cx * SCALE;
const OY = 100 - DESIGN.seal.cy * SCALE;
const ACCENT_STAGGER = 0.08;
// Polyline length is ~182.35 design px; +1 keeps offset==dasharray
// strictly inside the gap so no round-cap dot peeks at progress 0. Also
// feeds the successCheckDraw keyframe via --check-dash (see index.css).
const CHECK_DASH = 184;

// Animated success badge, reused wherever the app shows a "success"
// confirmation (email verified, phone verified, email updated, transaction
// successful, ...) instead of a static checkmark. Sequence: badge rises +
// pops in -> checkmark draws itself like it's being written -> decorative
// stars/dots pop out around it -> message text fades up. Everything is
// timed off one `badgeDelay` (an initial pause before anything starts,
// e.g. while a network call finishes). The check draw is a CSS animation
// (successCheckDraw) on the same delay chain as the rest, not a rAF loop,
// so every piece of the sequence runs on one timeline.
export default function SuccessBadge({ message, subMessage, badgeDelay = 0.1, className = "" }) {
  const accentStart = badgeDelay + 0.95;
  const textDelay = accentStart + DESIGN.accents.length * ACCENT_STAGGER + 0.15;

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

        {DESIGN.accents.map((a, i) => (
          <img
            key={i}
            src={a.src}
            alt=""
            draggable={false}
            className="absolute"
            style={{
              left: OX + a.x * SCALE,
              top: OY + a.y * SCALE,
              width: a.w * SCALE,
              height: a.h * SCALE,
              transformOrigin: "center",
              opacity: 0,
              animation: `successAccentPop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${accentStart + i * ACCENT_STAGGER}s both`,
            }}
          />
        ))}

        <div
          className="absolute"
          style={{
            width: SEAL_PX,
            height: DESIGN.seal.h * SCALE,
            top: "50%",
            left: "50%",
            opacity: 0,
            animation: `successBadgePop 0.65s cubic-bezier(0.34,1.56,0.64,1) ${badgeDelay}s both`,
          }}
        >
          <img
            src={sealSrc}
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          {/* The check draws over the seal's solid face via successCheckDraw:
              the design's own centerline and stroke weight (measured from
              the source PNG's check cutout), revealed on the same delay
              chain as the rest of the sequence (badgeDelay + 0.55s start,
              380ms duration — identical to the old rAF loop's timing). */}
          <svg
            viewBox={`${DESIGN.seal.x} ${DESIGN.seal.y} ${DESIGN.seal.w} ${DESIGN.seal.h}`}
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, display: "block" }}
          >
            <path
              d={DESIGN.check.d}
              fill="none"
              stroke="white"
              strokeWidth={DESIGN.check.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CHECK_DASH}
              style={{
                "--check-dash": CHECK_DASH,
                animation: `successCheckDraw 0.38s cubic-bezier(0.215,0.61,0.355,1) ${badgeDelay + 0.55}s both`,
              }}
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
