import { useEffect, useRef, useState } from "react";

// Copies `text` to the clipboard and flips a boolean "copied" flag for
// `duration` ms before reverting — the copy-button checkmark pattern used
// throughout the app for invite links, references, and 2FA secrets.
// `clipboard?.` guards contexts where the Clipboard API isn't available
// (older browsers, non-HTTPS) instead of throwing; a falsy `text` no-ops.
export function useCopyToClipboard(duration = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function copy(text) {
    if (!text) return;
    navigator.clipboard?.writeText(String(text)).then(() => {
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), duration);
    });
  }

  return [copied, copy];
}
