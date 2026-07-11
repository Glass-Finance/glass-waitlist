import { Loader2 } from "lucide-react";

// Single standardized "this section is loading" indicator — spinner + label,
// used in place of the plain "Loading…" text that used to appear
// inconsistently (no visual indicator at all) across the app. Drop it
// inside whatever structural wrapper the call site needs (a <td>, a <div>
// with its own padding, etc.) via className.
export default function LoadingState({ label = "Loading…", size = 14, className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-xs text-gray-400 ${className}`}>
      <Loader2 size={size} className="animate-spin flex-shrink-0" />
      {label}
    </div>
  );
}
