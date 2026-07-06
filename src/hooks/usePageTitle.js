import { useEffect } from "react";

const BASE = "Glasspay";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — Community Finance Crystal Clear`;
  }, [title]);
}
