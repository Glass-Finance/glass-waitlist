import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

// GET /api/v1/communities/me
// Returns a PAGINATED envelope: { content: [...], pageNumber, pageSize, totalElements, totalPages, last }
// Each community object includes: memberRole, memberStatus, owned, metrics{...}, logo{url,...}
async function fetchMyCommunities(params = {}) {
  const res = await client.get("/communities/me", { params });
  return res.data.data; // { content, pageNumber, pageSize, totalElements, totalPages, last }
}

export function useCommunities(params = {}) {
  return useQuery({
    queryKey: ["communities", "me", params],
    queryFn: () => fetchMyCommunities(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    select: (data) => {
      const content = data?.content ?? [];
      return {
        communities: content,
        totalElements: data?.totalElements ?? content.length,
        totalPages: data?.totalPages ?? 1,
        pageNumber: data?.pageNumber ?? 0,
      };
    },
  });
}