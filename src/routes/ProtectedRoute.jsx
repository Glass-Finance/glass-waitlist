import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

/**
 * IMPORTANT — before relying on this guard, confirm the exact string your
 * backend returns in `platformRole` on /auth/login (Network tab → response
 * body → data.platformRole). AuthContext.login() maps that value straight
 * into `user.role`. If the backend returns "MEMBER" or "PLATFORM_ADMIN"
 * instead of the lowercase "admin" / "member" assumed below, update the
 * comparisons here (and in MemberProtectedRoute.jsx) to match exactly.
 */
export default function ProtectedRoute({ requiredRole = null }) {
  const location = useLocation();
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/member/sign-in" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Fixed: "/member/invites" doesn't exist in the router — it 404s
    // through the catch-all and silently bounces the user to "/".
    // Members belong at their actual home route.
    return (
      <Navigate
        to={user?.role === "member" ? "/member/home" : "/dashboard/home"}
        replace
      />
    );
  }

  return <Outlet />;
}