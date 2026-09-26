import { useQuery } from "@tanstack/react-query";
import { getCrispToken } from "../api/support";

// Server-generated Crisp session token (see contract in src/api/support.js).
// - undefined → still loading (or not signed in: query disabled)
// - null      → endpoint not deployed yet (404) — chat runs without
//               token-bound continuity instead of erroring
// - string    → token to pass to Crisp.setTokenId()
// The token is stable per user, so it's cached for the session.
export function useCrispToken(userId) {
  return useQuery({
    queryKey: ["crisp-token", userId],
    enabled: !!userId,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res = await getCrispToken();
        return res.data?.data?.tokenId ?? null;
      } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
  });
}
