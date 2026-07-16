// The "Glass Logo Element Surface Overlay" per the design system spec:
// NOT the logo image itself blurred with filter:blur() (that was the
// earlier, wrong approach -- diluted the color almost to nothing at this
// scale, which is why --blur-ambient-glow existed as a workaround). The
// real technique is two layers: the logo mark as a plain color source,
// then a frosted panel (--color-surface-overlay: #F9F9FB at 95% opacity)
// with backdrop-filter: blur(120px) sitting in front of it, blurring the
// mark from behind rather than blurring the image asset directly. That
// backdrop-blur is what produces the soft, pastel, "milky" glow in the
// Figma reference instead of a visible logo silhouette.
export default function GlassLogoGlow({ className = "" }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <img
        src="/Bg.png"
        alt=""
        style={{
          position: "absolute",
          left: "-15%",
          bottom: "-10%",
          width: "85%",
          maxWidth: 420,
        }}
      />
      <div
        className="absolute inset-0 bg-surface-overlay"
        style={{
          backdropFilter: "blur(var(--blur-logo-overlay))",
          WebkitBackdropFilter: "blur(var(--blur-logo-overlay))",
        }}
      />
    </div>
  );
}
