import { forwardRef } from "react";

// Single source of truth for the app's primary CTA button — every auth and
// onboarding screen (Sign In, Sign Up, Join, Reset Password, Choose Path,
// Paying Member, Organization/Payment setup, Add Members, Check Email,
// Mobile Required) previously hand-rolled its own copy of this, which is how
// three different corner radii and one off-brand hex (#2535c3 instead of
// --color-brand) crept in across the app. Always uses --color-brand
// (bg-brand) -- never hardcode the button color elsewhere.
export const Button = forwardRef(function Button(
  {
    children,
    type = "button",
    onClick,
    disabled,
    loading,
    fullWidth = true,
    className = "",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${fullWidth ? "w-full " : ""}rounded-2xl py-4 text-button font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed ${isDisabled ? "bg-[#B0B8D8]" : "bg-brand hover:opacity-90"} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});