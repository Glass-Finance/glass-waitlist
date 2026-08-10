import solutionGlow from "../../assets/solution-glow.webp";

// Same pre-rendered glow art ProblemSection/SolutionSection already use as
// their section background (not a CSS-drawn effect) — reused here so every
// landing-page section shares one consistent "glass blue" glow all the way
// down to the footer, instead of it only appearing on Problem/Solution/
// Security and going flat everywhere else.
//
// Fixed pixel backgroundSize instead of `cover`: `cover` scales the image to
// fill whatever box it's in, so the exact same art renders at wildly
// different sizes/crops per section (a short section like TrustedBy vs. a
// tall one like UseCases) — in several sections that cropped the glow down
// to an invisible sliver at the very edge. A fixed size anchored to one
// corner renders identically everywhere, which is the actual "consistent"
// being asked for. Render as the first child of a `relative overflow-hidden`
// section, before the real content (which needs its own `relative z-10`).
export default function GlowOrbs() {
  return (
    <div
      className="absolute inset-0 pointer-events-none bg-no-repeat"
      style={{
        backgroundImage: `url(${solutionGlow})`,
        backgroundSize: "640px auto",
        backgroundPosition: "left top",
      }}
      aria-hidden="true"
    />
  );
}
