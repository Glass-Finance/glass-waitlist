// The "Glass Logo Element Surface Overlay" ambient background treatment used
// across the member app's mobile pages: the flat-blue Glass logo mark
// (public/Bg.png -- same asset used for the landing page's Problem-section
// watermark, for consistency), blown up and blurred into a soft glow,
// bottom-left, sitting behind page content.
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
          filter: "blur(var(--blur-ambient-glow))",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
