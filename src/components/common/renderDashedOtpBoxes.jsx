// Shared dashed OTP box renderer — a render PROP, not a component.
//
// Passed to <OtpBoxes renderBoxes={...} />, which invokes it as
// renderBoxes(digits, activeIndex) to draw the boxes over its single hidden
// <input>. It must therefore stay a plain function returning JSX.
//
// This used to live in src/pages/auth/member/Join/otpBoxes.jsx. It moved out
// when the OTP input itself was unified (see OtpBoxes.jsx) so every surface —
// member join, sign-in, forgot-password, and the member-app settings phone /
// email flows — could render one box style. It is a standalone module on
// purpose: a file that mixes a plain render-prop function with exported
// components breaks Fast Refresh (react-refresh/only-export-components),
// which is why the component and this renderer are not co-located.
const OTP_LENGTH = 6;

export function renderDashedOtpBoxes(boxDigits, activeIndex) {
  return (
    <div className="flex items-center justify-between gap-2 pointer-events-none">
      <div className="flex gap-2 flex-1 min-w-0">
        {boxDigits.slice(0, 3).map((d, i) => (
          <div
            key={i}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || i === activeIndex ? "border-brand-deep" : "border-hairline-neutral"}`}
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
              className={`flex-1 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 transition-all duration-150 min-w-0 max-w-16 text-[22px] border-[1.5px] ${d || idx === activeIndex ? "border-brand-deep" : "border-hairline-neutral"}`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default renderDashedOtpBoxes;
