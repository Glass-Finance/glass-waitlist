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
      className={className}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding,
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <BrandedSpinner size={size} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#333", margin: 0 }}>
        {label}
      </p>
      {subtitle && (
        <p style={{ fontSize: 13, color: "#999", margin: "6px 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
