import CloudImage from "./CloudImage";

// The app's one branded loading indicator -- a spinning ring around the
// logo mark, previously only used for the full-screen route-transition
// fallback (LoadingScreen.jsx). Factored out so other loading states
// (e.g. member Home's) can use the same visual instead of a generic
// spinner icon.
//
// This is the FULL-PAGE level of the loading system. It reaches the screen
// through exactly two components, both of which delegate here:
//   - PageLoadingState — a full-screen block with a label and subtitle
//   - LoadingScreen — the fixed overlay the route guards and App Suspense use
// The inline level is LoadingState, which uses a lucide ring instead of the
// logo (illegible at 14px) but keeps the same brand-deep hue.
export default function BrandedSpinner({ size = 64 }) {
  const logoSize = Math.round(size * 0.44);
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full border-[1.5px] border-brand-deep/10 border-t-brand-deep animate-spin" />
      <CloudImage
        publicId="glass/Glass"
        alt=""
        width={logoSize * 2}
        objectFit="contain"
        style={{ width: logoSize, height: logoSize }}
      />
    </div>
  );
}
