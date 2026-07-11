import { useMemo } from "react";
import { useMyCommunities } from "./useMyAccount";
import { buildCommunityMap } from "../utils/notificationContent";

// A notification only ever carries `communityId` (a raw uuid) — never a
// name or logo — so anything that wants to display "X requested to join
// Kings College Alumni" needs to resolve that id against the user's own
// communities list. Shares the ["communities"] cache key with the rest of
// the app, so this adds no extra network traffic anywhere it's already
// been fetched (Sidebar, CommunitiesHome, payments hooks, etc.).
export function useCommunityMap() {
  const { data } = useMyCommunities();
  return useMemo(() => buildCommunityMap(data), [data]);
}
