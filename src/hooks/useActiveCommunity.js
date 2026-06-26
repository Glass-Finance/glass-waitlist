import { useSearchParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Resolves the active community id/slug for admin pages.
// Convention (matches AdminDashboard.jsx): URL ?community= param, falling
// back to the last community the admin clicked into from CommunitiesHome,
// stashed in localStorage under "glass_community".
// ─────────────────────────────────────────────────────────────────────────────
export function useActiveCommunityId() {
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("community");
  if (fromParam) return fromParam;
  try {
    const stored = JSON.parse(localStorage.getItem("glass_community") ?? "{}");
    return stored.slug ?? stored.id ?? null;
  } catch {
    return null;
  }
}

