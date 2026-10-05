import BrandedSpinner from "./BrandedSpinner";

// The app's one full-page loading treatment — a large BrandedSpinner on
// its own, used whenever a whole screen has nothing else to show yet.
//
// This used to live in components/memberApp/, but the member auth join flow
// needed it too, so it was sitting one directory away from a dozen of its own
// callers. It is a cross-cutting concern, not a member-app one, hence
// components/common/. LoadingScreen.jsx renders this same component for the
// route-transition overlay, so the branded treatment is identical everywhere.
//
// level defaults to "page" to preserve the historical call shape; the
// "inline" level is the escape hatch for a full-width block that should not
// claim a whole page.
export default function PageLoadingState({
  className = "",
  size = 80,
  padding = "60px 32px 80px",
  level = "page",
}) {
  const inline = level === "inline";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${inline ? "py-10" : "flex-1"} ${className}`}
      style={inline ? undefined : { padding }}
      role="status"
      aria-live="polite"
    >
      <BrandedSpinner size={inline ? Math.round(size * 0.5) : size} />
    </div>
  );
}
