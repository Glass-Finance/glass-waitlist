import { Loader2 } from "lucide-react";

// Single standardized "this section is loading" indicator — spinner + label,
// used in place of the plain "Loading…" text that used to appear
// inconsistently (no visual indicator at all) across the app. Drop it
// inside whatever structural wrapper the call site needs (a <td>, a <div>
// with its own padding, etc.) via className.
//
// This is the INLINE level of the loading system. The full-page level is
// PageLoadingState (same directory), which shares BrandedSpinner with the
// route-transition overlay via LoadingScreen. The two are deliberately not
// the same component: at 14px the Glass logo mark is illegible, so inline
// loading uses a lucide ring instead. What they do share is the colour
// language — the ring is brand-deep to match the branded full-page spinner,
// and both use the same neutral label token. Before this, the inline variant
// was `text-gray-400`, a raw Tailwind gray that appeared nowhere else in the
// app and read as a different design system next to the branded spinner.
export default function LoadingState({ label = "Loading…", size = 14, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 text-xs text-ink-faint ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={size} className="animate-spin flex-shrink-0 text-brand-deep" />
      {label}
    </div>
  );
}
