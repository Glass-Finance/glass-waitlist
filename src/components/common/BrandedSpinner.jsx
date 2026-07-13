import GlassLogo from "../../assets/Glass.webp";

// The app's one branded loading indicator -- a spinning ring around the
// logo mark, previously only used for the full-screen route-transition
// fallback (LoadingScreen.jsx). Factored out so other loading states
// (e.g. member Home's) can use the same visual instead of a generic
// spinner icon.
export default function BrandedSpinner({ size = 64 }) {
  const logoSize = Math.round(size * 0.44);
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full border-[1.5px] border-[#1C2B8A]/10 border-t-[#1C2B8A] animate-spin" />
      <img
        src={GlassLogo}
        alt=""
        className="object-contain"
        style={{ width: logoSize, height: logoSize }}
      />
    </div>
  );
}
