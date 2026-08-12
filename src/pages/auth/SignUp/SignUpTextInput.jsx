import { forwardRef } from "react";

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
  const invalid = Boolean(error);
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-placeholder outline-none transition-all border-[1.5px] ${invalid ? "border-danger" : "border-[#C2C2C2] focus:border-[#2535c3]"} ${className}`}
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
