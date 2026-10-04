import { motion, useReducedMotion } from "motion/react";
import { idTypeLabel } from "../../../utils/kycStatus";
import { FaceScanArt, GlyphLock } from "../illustrations";

// Step 2 — What happens next. Replaces the old "Capture your BVN" screen.
//
// The point of this step is the hand-off: Glass collects nothing, so the user
// needs to see *where* they are about to type their ID number and roughly how
// long it takes. The preview panel is explicitly labelled a preview so it is
// never mistaken for a real Smile ID frame on this page.
const TASKS = [
  {
    key: "enter",
    title: "Enter your {id}",
    note: "Type the 11 digits. Glass never sees them.",
    time: "30 sec",
  },
  {
    key: "selfie",
    title: "Take a quick selfie",
    note: "We match it to your {id} record.",
    time: "1 min",
  },
];

export default function NextUpStep({ idType }) {
  const reduce = useReducedMotion();
  const id = idTypeLabel(idType);
  const fill = (text) => text.replace(/\{id\}/g, id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.09em] text-ink-faint m-0">Next up</p>
        <h3 className="text-[15px] font-bold text-ink mt-1 mb-0">Here&apos;s what happens next</h3>
        <p className="text-[13px] text-ink-muted mt-1 mb-0 leading-[1.55]">
          A secure Smile ID window opens on top of Glass. It takes about 2 minutes.
        </p>
      </div>

      {/* Preview of the hand-off window — not an interactive capture surface. */}
      <div className="rounded-2xl border border-surface-container-border bg-white overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-stacked-container text-[11px] font-medium text-ink-strong">
          <GlyphLock size={12} />
          Smile ID · secure window
          <span className="ml-auto text-[9.5px] uppercase tracking-[0.07em] text-ink-faint">
            Preview
          </span>
        </div>
        <div className="relative flex items-center justify-center bg-brand-tint/50 aspect-[12/7]">
          <span className="opacity-80">
            <FaceScanArt size={104} />
          </span>
          {!reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute w-[62%] h-[2px] rounded-full bg-brand/35"
              initial={{ top: "26%" }}
              animate={{ top: ["26%", "70%", "26%"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </div>

      <ol className="flex flex-col gap-2.5 list-none p-0 m-0">
        {TASKS.map(({ key, title, note, time }, i) => (
          <li key={key} className="flex items-start gap-2.5">
            <span className="w-[17px] h-[17px] rounded-full bg-brand-tint text-brand text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-[1px]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink m-0 leading-tight">{fill(title)}</p>
              <p className="text-[11px] text-ink-muted m-0 mt-0.5 leading-snug">{fill(note)}</p>
            </div>
            <span className="text-[10.5px] text-ink-faint flex-shrink-0 mt-[1px]">{time}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
