import { useEffect } from "react";

// Runs `onOutside` for any mousedown that lands outside `ref`'s element —
// the dropdown/panel/search-suggestions close-on-outside-click pattern used
// throughout the dashboard chrome. Pass `active = false` (e.g. the panel
// isn't open) to skip attaching the listener entirely.
export function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onOutside(e);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [active, onOutside, ref]);
}
