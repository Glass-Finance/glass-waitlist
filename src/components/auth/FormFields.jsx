import { forwardRef, useState } from "react";

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
  const [focused, setFocused] = useState(false);
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
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        className="w-full rounded-xl px-4 py-3.5 text-placeholder text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 bg-white disabled:opacity-50"
        style={{
          border: invalid
            ? "1.5px solid var(--color-danger)"
            : focused
              ? "1.5px solid #1C2B8A"
              : "1.5px solid #E0E0E6",
        }}
        {...rest}
      />
      {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
    </div>
  );
});

export function PrimaryButton({ children, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-full py-4 text-button font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
      style={{ background: disabled || loading ? "#B0B8D8" : "#1C2B8A" }}
    >
      {children}
    </button>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1.5 px-1 text-danger" role="alert">
      {message}
    </p>
  );
}
