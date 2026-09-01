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
    // "lg" matches the taller auth-page inputs (Sign In, Sign Up, Join,
    // Reset Password, Choose Path, Paying Member, Check Email, Mobile
    // Required). "sm" matches the more compact card-form inputs used by
    // the Organization/Payment/Members onboarding funnel -- a button that
    // height-matches its own page's inputs, not a fixed size everywhere.
    size = "lg",
    // "brand" (default, unchanged) is the primary CTA everywhere. "danger"
    // and "secondary" cover the two other button roles that kept getting
    // hand-rolled with their own bespoke classes instead of going through
    // this component (e.g. Security.jsx's Disable MFA / Cancel) -- adding
    // them here instead of a third bespoke copy.
    variant = "brand",
    className = "",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const sizeClasses = size === "sm" ? "py-3 text-sm" : "py-4 text-button";
  const variantClasses = isDisabled
    ? "text-white bg-[#B0B8D8]"
    : variant === "danger"
      ? "text-white bg-danger hover:opacity-90"
      : variant === "secondary"
        ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
        : "text-white bg-brand hover:opacity-90";
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${fullWidth ? "w-full " : ""}rounded-lg ${sizeClasses} font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${variantClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
