import {
  IdCardArt,
  FaceScanArt,
  CheckBadgeArt,
  GlyphLock,
  GlyphCommunity,
  GlyphPlans,
  GlyphPayout,
  TrustNote,
} from "../illustrations";

// Step 1 — Overview. First-time entry: the payoff preview (brief item 6)
// shows the almost-ready dashboard BEFORE the heavy capture step, and the
// numbered 01/02/03 sequence (marloden-style) sets expectations. No
// fabricated amounts — the preview tiles read "—" behind a lock chip until
// verification unlocks them.
const SEQUENCE = [
  { n: "01", label: "Pick your ID", Art: IdCardArt },
  { n: "02", label: "Quick ID check", Art: FaceScanArt },
  { n: "03", label: "You're verified", Art: CheckBadgeArt },
];

const UNLOCKS = [
  { Glyph: GlyphCommunity, text: "Create & manage communities" },
  { Glyph: GlyphPlans, text: "Set up payment plans" },
  { Glyph: GlyphPayout, text: "Receive contributions & payouts" },
];

export default function IntroStep({ reason }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[15px] font-bold text-[#111] m-0">
          One quick check, then you&apos;re in
        </h3>
        <p className="text-[13px] text-[#6B7280] mt-1 mb-0 leading-[1.55]">
          {reason ??
            "Identity verification is required to create or manage communities. It only takes a few minutes."}
        </p>
      </div>

      {/* Payoff preview — a locked glimpse of the dashboard this unlocks */}
      <div className="relative rounded-2xl border border-surface-container-border bg-surface-container backdrop-blur-xl p-3.5 pt-4">
        <span className="absolute -top-2.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-white border border-surface-container-border px-2.5 py-[3px] text-[10px] font-semibold text-brand shadow-sm">
          <GlyphLock size={11} />
          Unlocks after verification
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-white/70 border border-surface-container-border px-3 py-2.5">
            <p className="text-[9.5px] uppercase tracking-[0.06em] text-[#9CA3AF] m-0">
              Contributions
            </p>
            <p className="text-[17px] font-semibold text-[#C4C9D4] m-0 mt-0.5 leading-tight">—</p>
          </div>
          <div className="rounded-xl bg-white/70 border border-surface-container-border px-3 py-2.5">
            <p className="text-[9.5px] uppercase tracking-[0.06em] text-[#9CA3AF] m-0">
              Payment plans
            </p>
            <p className="text-[17px] font-semibold text-[#C4C9D4] m-0 mt-0.5 leading-tight">—</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-white/70 border border-surface-container-border px-3 py-2.5">
          <span className="w-8 h-8 rounded-lg bg-stacked-container border border-dashed border-[#C4C9D4] flex items-center justify-center text-[#C4C9D4]">
            <GlyphCommunity size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#9CA3AF] m-0 truncate">Your community</p>
            <p className="text-[10.5px] text-[#C4C9D4] m-0">Ready to set up</p>
          </div>
        </div>
      </div>

      {/* How it works — numbered sequence with the flow's own illustrations */}
      <div className="grid grid-cols-3 gap-2">
        {SEQUENCE.map(({ n, label, Art }) => (
          <div key={n} className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-[10px] font-bold text-brand tracking-[0.05em]">{n}</span>
            <span className="w-12 h-12 rounded-full bg-brand-tint flex items-center justify-center">
              <Art size={26} />
            </span>
            <span className="text-[10.5px] text-[#6B7280] leading-tight">{label}</span>
          </div>
        ))}
      </div>

      <TrustNote>
        Verification runs through Smile ID, our identity partner. Encrypted end to end — Glass never
        sees your ID number or photo.
      </TrustNote>
    </div>
  );
}
