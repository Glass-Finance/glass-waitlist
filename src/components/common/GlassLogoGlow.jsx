import glassMark from "../../assets/brand/glass-mark-gradient.svg";

// The "Glass Logo Element Surface Overlay" ambient background treatment used
// across the member app's mobile pages: the blue-to-purple Glass logo mark,
// blown up and heavily blurred, sitting behind page content. Replaces the
// earlier hand-tuned radial-gradient approximation of this same effect.
export default function GlassLogoGlow({ className = "" }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <img
        src={glassMark}
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
