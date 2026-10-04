import { KYC_SUBMITTABLE_ID_TYPE_OPTIONS } from "../../../utils/kycStatus";
import { GlyphCheckMark, TrustNote } from "../illustrations";

// Step 1 — Pick your ID. Selectable cards with the brand ring on the selected
// one, plus the trust note directly under the sensitive choice.
//
// Only submittable values are offered: the backend's KycIdType enum is
// BVN/NIN_V2, so any other card here is a dead end the user can pick. The
// cards stay plain — no dial codes or recovery hints, since Glass has no USSD
// surface to point at.
export default function IdTypeStep({ idType, setIdType, disabled = false }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.09em] text-ink-faint m-0">
          Identity check · about 2 minutes
        </p>
        <h3 className="text-[15px] font-bold text-ink mt-1 mb-0">
          Pick the ID you&apos;ll verify with
        </h3>
        <p className="text-[13px] text-ink-muted mt-1 mb-0 leading-[1.55]">
          Identity verification is required to create or manage communities.
        </p>
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="ID type">
        {KYC_SUBMITTABLE_ID_TYPE_OPTIONS.map((opt) => {
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
                  ? "border-transparent shadow-[0_0_0_2px_var(--color-brand)] text-ink font-medium"
                  : "border-hairline-neutral text-ink hover:border-gray-300",
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
