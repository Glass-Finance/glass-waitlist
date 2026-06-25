import GlassLogo from "../../assets/Glass.png";
import QRCodeCanvas from "../dashboard/QRCode";

/**
 * Shared "scan this QR to continue on your phone" screen — was duplicated
 * with two different looks (MobileRequired.jsx's older blue-QR/icon
 * version vs CheckEmail.jsx's Figma-matched version). Pages render their
 * own heading/copy/extra content (e.g. the "Or Use Email" fallback) as
 * children instead of this component knowing about those specifics.
 */
export default function QRScanScreen({
  heading,
  subheading,
  url,
  onContinue,
  continueLabel = "Continue",
  children,
}) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#E5E5E5" }}>
      <header className="px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-gray-900 text-base" style={{ fontFamily: "var(--font-sans)" }}>
            Glass
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: "var(--font-sans)" }}>
          {heading}
        </h1>
        {subheading && (
          <p className="text-sm text-gray-500 mb-8 text-center">{subheading}</p>
        )}

        <div className="p-3 bg-white rounded-2xl mb-8" style={{ border: "1px solid #E5E7EB" }}>
          <QRCodeCanvas value={url} size={200} color="#000000" />
        </div>

        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full max-w-sm py-3.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] border-none cursor-pointer"
            style={{ background: "#002FA7" }}
          >
            {continueLabel}
          </button>
        )}

        {children}
      </main>
    </div>
  );
}
