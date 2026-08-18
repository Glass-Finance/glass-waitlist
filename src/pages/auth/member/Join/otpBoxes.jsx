import { OTP_LENGTH } from "./constants";

// OTP boxes — split with dash. Figma spec is a fixed 64px box, but this
// screen is hard mobile-gated (member join is mobile-only) and has to fit
// down to a 360px Android/iPhone SE, where 6×64px+gaps (~460px) simply
// doesn't fit -- boxes stay flex-1 (shrink together to fit the real
// viewport) but the cap is raised to 64px so on any screen with room, they
// render at full spec size instead of settling for the old 48px cap.
// Shared by StepOTP and StepSignInOtp, which rendered byte-identical JSX
// for this before the Join.jsx split.
//
// Kept in its own file (not shared.jsx) since it's passed around as a
// render-prop function, not rendered as a JSX element -- Fast Refresh can't
// hot-reload a file that mixes a plain function like this with real
// components (Label, ErrorMessage) without losing their state.
export function renderDashedOtpBoxes(boxDigits, activeIndex) {
  return (
    <div className="flex items-center justify-between gap-2 pointer-events-none">
      <div className="flex gap-2 flex-1 min-w-0">
        {boxDigits.slice(0, 3).map((d, i) => (
          <div
            key={i}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || i === activeIndex ? "border-[#1C2B8A]" : "border-[#D0D5E8]"}`}
          >
            {d}
          </div>
        ))}
      </div>
      <span className="text-gray-400 text-xl font-light flex-shrink-0">—</span>
      <div className="flex gap-2 flex-1 min-w-0">
        {boxDigits.slice(3, 6).map((d, i) => {
          const idx = i + 3;
          return (
            <div
              key={idx}
              aria-label={`Digit ${idx + 1} of ${OTP_LENGTH}`}
              className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || idx === activeIndex ? "border-[#1C2B8A]" : "border-[#D0D5E8]"}`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
