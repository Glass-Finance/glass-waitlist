import { ID_TYPE_OPTIONS } from "../../../utils/kycStatus";
import { GlyphCheckMark, TrustNote } from "../illustrations";

// Step 2 — ID type. Selectable cards with the brand ring on the selected
// one (existing pattern from the verify pages, tokenized), plus the trust
// note directly under the sensitive choice (brief item 5).
export default function IdTypeStep({ idType, setIdType, disabled = false }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <h3 className="text-[15px] font-bold text-[#111] m-0">Which ID will you use?</h3>
        <p className="text-[13px] text-[#6B7280] mt-1 mb-0 leading-[1.55]">
          Pick the document you have on hand — you&apos;ll verify with it inside Smile ID&apos;s
          secure window.
        </p>
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="ID type">
        {ID_TYPE_OPTIONS.map((opt) => {
          const selected = idType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => setIdType(opt.value)}
              className={[
                "w-full flex items-center justify-between gap-2 text-left py-3 px-3.5 rounded-xl border bg-white cursor-pointer text-sm transition-all",
                selected
                  ? "border-transparent shadow-[0_0_0_2px_var(--color-brand)] text-[#111] font-medium"
                  : "border-[#E5E7EB] text-[#111] hover:border-gray-300",
                disabled ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {opt.label}
              {selected && (
                <span className="w-[18px] h-[18px] rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0">
                  <GlyphCheckMark size={10} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <TrustNote>
        You&apos;ll enter your ID number directly with Smile ID — Glass never sees or stores the raw
        number.
      </TrustNote>
    </div>
  );
}
