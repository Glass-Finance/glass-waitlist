import { motion, useReducedMotion } from "motion/react";
import { idTypeLabel } from "../../../utils/kycStatus";
import { IdCardArt, ViewfinderFrame, GlyphCheckMark, TrustNote } from "../illustrations";

// Step 3 — Capture prep (brief item 2, the highest-impact visual change).
// A viewfinder-style frame with corner brackets and a ghost ID illustration
// sits at the center even on desktop — it previews the document check the
// Smile ID window will run. Glass never captures anything itself; this
// screen sets up the hand-off.
const TIPS = [
  "Good lighting — hold your ID flat, away from glare",
  "Have this ID within reach before you start",
  "The check takes about two minutes",
];

export default function CapturePrepStep({ idType }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[15px] font-bold text-[#111] m-0">
          Capture your {idTypeLabel(idType)}
        </h3>
        <p className="text-[13px] text-[#6B7280] mt-1 mb-0 leading-[1.55]">
          You&apos;ll be asked to photograph it and take a quick selfie check.
        </p>
      </div>

      <ViewfinderFrame className="mx-auto w-full max-w-[290px] aspect-[1.55/1] bg-brand-tint/40">
        <div className="flex flex-col items-center">
          <span className="opacity-70">
            <IdCardArt size={110} />
          </span>
          {!reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute w-[72%] h-[2px] rounded-full bg-brand/35"
              initial={{ top: "24%" }}
              animate={{ top: ["24%", "76%", "24%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </ViewfinderFrame>

      <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
        {TIPS.map((tip) => (
          <li
            key={tip}
            className="flex items-start gap-2 text-[12.5px] text-[#374151] leading-[1.45]"
          >
            <span className="w-[15px] h-[15px] rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 mt-[1.5px]">
              <GlyphCheckMark size={9} />
            </span>
            {tip}
          </li>
        ))}
      </ul>

      <TrustNote>
        Capture happens inside Smile ID&apos;s secure window. We only receive the verification
        result — never the photo.
      </TrustNote>
    </div>
  );
}
