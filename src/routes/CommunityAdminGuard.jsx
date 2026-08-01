import { Navigate, Outlet } from "react-router-dom";
import { useActiveCommunityId } from "../hooks/useActiveCommunityId";
import { useCommunities } from "../hooks/useCommunities";
import { isCommunityAdmin } from "../utils/communityRole";
import LoadingScreen from "../components/LoadingScreen";

// ProtectedRoute's requiredRole="admin" only proves the user administers
// SOME community — it says nothing about the specific community these
// routes act on, which comes from a client-controlled ?community= param
// (or a cached localStorage fallback, see useActiveCommunityId). Without
// this guard, a Community Admin of community A who is merely a Member (or
// not a member at all) of community B could edit the URL to ?community=B
// and reach B's member list/detail, join-requests, payments, payout
// account, or role-management screens.
export default function CommunityAdminGuard() {
  const communityId = useActiveCommunityId();
  const { data, isLoading, isFetching } = useCommunities();

  // No community resolved yet — nothing community-scoped to protect here;
  // the page itself is responsible for its own empty state.
  if (!communityId) return <Outlet />;

  if (isLoading) return <LoadingScreen />;

  const communities = data?.communities ?? [];
  const active = communities.find(
    (c) => c.slug === communityId || String(c.id) === String(communityId),
  );

  // Not found in the cached list isn't necessarily "not an admin here" —
  // e.g. right after onboarding creates a community, this list was
  // invalidated but is still serving its pre-creation snapshot while a
  // background refetch is in flight (isLoading only covers the *first*
  // fetch, not a stale-data refetch). Wait that out before concluding this
  // user doesn't administer the community and bouncing them to
  // /dashboard/home — otherwise a freshly-created community's own admin
  // gets redirected away from the dashboard they were just sent to.
  if (!active && isFetching) return <LoadingScreen />;

  if (!active || !isCommunityAdmin(active)) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <Outlet />;
}
