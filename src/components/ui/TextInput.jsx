import { forwardRef } from "react";

// #002FA7 is the one active-state color for every input in the app (per
// Figma) -- a stroke-only change, deliberately no background fill, since a
// filled active state reads as a button rather than a field. Resting
// border color is still allowed to vary a little per flow (literal class
// strings, not template-interpolated, so Tailwind's scanner picks them up).
const VARIANTS = {
  default: "border-[#E0E0E6] focus:border-[#002FA7]",
  signup: "border-[#C2C2C2] focus:border-[#002FA7]",
};

// Single source of truth for the app's text/email/password/number inputs —
// per Figma, every input across every screen (desktop and mobile) shares
// the same height, radius, border, and padding; only width is allowed to
// differ per screen, which is why width isn't baked in here (parents size
// this via their own layout, w-full by default). Before this existed,
// nearly every page rolled its own `inputCls` string, so radius alone
// ranged from 2px to 12px across the app with no two pages agreeing on
// height or padding either.
export const TextInput = forwardRef(function TextInput(
  {
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    onBlur,
    onKeyDown,
    onFocus,
    autoComplete,
    inputMode,
    disabled,
    rightElement,
    error,
    maxLength,
    variant = "default",
    className = "",
    ...rest
  },
  ref,
) {
  const invalid = Boolean(error);
  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        className={`w-full h-16 min-h-8 rounded-lg border-[1.5px] px-6 py-1 text-placeholder text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${invalid ? "border-danger" : VARIANTS[variant]} ${className}`}
        {...rest}
      />
      {rightElement && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</div>}
    </div>
  );
});
