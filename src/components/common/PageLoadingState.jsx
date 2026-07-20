import BrandedSpinner from "./BrandedSpinner";

// The app's one full-page loading treatment -- a large BrandedSpinner plus a
// message, used whenever a whole screen has nothing else to show yet (the
// member Home page originated this look; other pages should use this
// instead of a small generic spinner so the loading experience is
// consistent everywhere, not just on Home).
export default function PageLoadingState({
  label = "Loading…",
  subtitle = "This won't take long.",
  className = "",
  size = 80,
  padding = "60px 32px 80px",
}) {
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center text-center ${className}`}
      style={{ padding }}
    >
      <div className="mb-5">
        <BrandedSpinner size={size} />
      </div>
      <p className="text-[15px] font-semibold text-[#333] m-0">
        {label}
      </p>
      {subtitle && (
        <p className="text-[13px] text-[#999] mt-1.5 mx-0 mb-0">
          {subtitle}
        </p>
      )}
    </div>
  );
}
