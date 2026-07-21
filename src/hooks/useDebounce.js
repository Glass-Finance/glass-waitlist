import { useRef } from "react";

// Returns a debounced version of `setter` — calling it repeatedly only
// invokes `setter` once, `delay` ms after the last call. The search-input
// pattern used across every AdminPanel section and SystemConfig.
export function useDebounce(setter, delay = 350) {
  const ref = useRef(null);
  return (val) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setter(val), delay);
  };
}
