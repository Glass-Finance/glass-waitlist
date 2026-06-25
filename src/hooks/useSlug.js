import { useEffect, useRef, useState } from "react";
import { verifySlug, getSlugOptions } from "../api/slugs";

// ─────────────────────────────────────────────────────────────────────────────
// useSlug — debounced slug suggestion + availability check.
// type: "COMMUNITY" | "PAYMENT_LINK"
//
// Usage:
//   const { slug, setSlug, available, checking, suggestFrom } = useSlug("COMMUNITY");
//   suggestFrom(name) on name-field blur → auto-fills `slug` with a suggestion
//   setSlug(value) on manual edit → re-verifies availability after a debounce
// ─────────────────────────────────────────────────────────────────────────────
export function useSlug(type) {
  const [slug, setSlug] = useState("");
  const [available, setAvailable] = useState(null); // null = unknown/untouched
  const [checking, setChecking] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const timerRef = useRef(null);

  // Suggest a slug from a name (call on name-field blur)
  async function suggestFrom(name) {
    if (!name?.trim()) return;
    setSuggesting(true);
    try {
      const res = await getSlugOptions(type, name.trim());
      const data = res.data?.data;
      const next = data?.base || data?.options?.[0] || "";
      if (next) {
        setSlug(next);
        setAvailable(data?.available ?? null);
      }
    } catch {
      // Non-fatal — user can still type a slug manually
    } finally {
      setSuggesting(false);
    }
  }

  // Re-verify availability whenever slug changes (debounced)
  useEffect(() => {
    if (!slug?.trim()) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await verifySlug(type, slug.trim());
        setAvailable(res.data?.data?.available ?? null);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [slug, type]);

  return { slug, setSlug, available, checking, suggesting, suggestFrom };
}
