import { forwardRef } from "react";
import { Button } from "../ui/Button";

// Shared input primitives for the unified auth pages (SignIn,
// ForgotPassword, ResetPassword) — used identically inside AuthLayout's
// desktop and mobile chrome, since the form itself doesn't need to change
// shape between them, only the shell around it does.

export function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-label font-medium mb-1.5 text-[#111]">
      {children}
    </label>
  );
}

// forwardRef so callers (e.g. SignIn's MFA code field) can focus() the
// underlying <input> directly — a plain function component here would
// silently swallow the ref instead of erroring, which is what happened
// before this existed.
export const TextInput = forwardRef(function TextInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
  disabled,
  rightElement,
  error,
  ...rest
}, ref) {
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
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        className={`w-full rounded-xl px-4 py-3.5 text-placeholder text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white disabled:opacity-50 border-[1.5px] ${invalid ? "border-danger" : "border-[#E0E0E6] focus:border-[#1C2B8A]"}`}
        {...rest}
      />
      {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
    </div>
  );
});

// Re-exported under this name so SignIn/ForgotPassword/ResetPassword don't
// need their import paths touched -- the actual implementation lives in
// components/ui/Button.jsx, the one shared primary CTA for the whole app.
export const PrimaryButton = Button;

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1.5 px-1 text-danger" role="alert">
      {message}
    </p>
  );
}
