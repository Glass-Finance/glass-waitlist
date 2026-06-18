import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

// GET /api/v1/communities/{communityIdentifier}/members
// Returns the member list for a given community.
async function fetchMembers(communityIdentifier) {
  const res = await client.get(`/communities/${communityIdentifier}/members`);
  return res.data.data;
}

// Usage:
//   const { data, isLoading, error } = useMembers("my-community-slug");
//
// communityIdentifier can be a slug or ID — matches {communityIdentifier}
// in the backend route.
export function useMembers(communityIdentifier) {
  return useQuery({
    queryKey: ["members", communityIdentifier],
    queryFn: () => fetchMembers(communityIdentifier),
    enabled: !!communityIdentifier,   // don't fire until we have an identifier
    staleTime: 1000 * 60 * 5,        // 5 min — member lists change infrequently
    gcTime:    1000 * 60 * 15,
    select: (data) => {
      const members = Array.isArray(data) ? data : (data?.members ?? []);
      return { members, total: members.length };
    },
  });
}