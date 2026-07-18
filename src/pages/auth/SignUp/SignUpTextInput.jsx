import { forwardRef, useState } from "react";

// Shared input for the SignUp step flow (EmailPhoneStep, RegisterStep) —
// was duplicated as a raw <input> + module-level inputCls/inputStyle/
// onFocus/onBlur in both files, with the same #2535c3/#C2C2C2 pair typed
// out twice. Kept deliberately separate from the generic auth
// FormFields.jsx TextInput, which uses #1C2B8A — this flow has its own
// established accent color, not a bug to unify away.
export const SignUpTextInput = forwardRef(function SignUpTextInput({
  onFocus,
  onBlur,
  error,
  className = "",
  ...rest
}, ref) {
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(error);
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-placeholder outline-none transition-all ${className}`}
      style={{
        border: invalid
          ? "1.5px solid var(--color-danger)"
          : focused
            ? "1.5px solid #2535c3"
            : "1.5px solid #C2C2C2",
      }}
      {...rest}
    />
  );
});

export function SignUpFieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1 px-0.5 text-danger" role="alert">
      {message}
    </p>
  );
}
