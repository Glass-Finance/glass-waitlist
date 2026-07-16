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
      // A positioned element paints above normal-flow content regardless of
      // DOM order -- that's a CSS stacking rule, not related to source
      // order. The old single-image version got away with this because
      // most of its pixels were transparent, so nothing visibly covered
      // the real page content even though it was technically on top. The
      // Surface Overlay panel below is a ~95%-opaque, full-area layer, so
      // without an explicit negative z-index it was painting straight over
      // every page's real content, washing it out to near-blank.
      style={{ zIndex: -1 }}
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
