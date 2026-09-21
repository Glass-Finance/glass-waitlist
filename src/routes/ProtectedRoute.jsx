import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

/**
 * requiredRole: "admin" | "member" | undefined
 * AuthContext grants admin dashboard access to either a global platform
 * admin (platformRole other than USER) or an administrator of at least one
 * community. Platform-only pages have an additional PlatformAdminRoute.
 */
export default function ProtectedRoute({ requiredRole, signInPath = "/sign-in" }) {
  const location = useLocation();
  const { token, sessionVerified, isAdmin, isMember, loading } = useAuth();

  // An unverified session (token present but not yet confirmed by the
  // backend, or confirmation failed) is treated as unauthenticated — it
  // redirects rather than rendering protected content or hanging on a
  // loading screen that no in-flight verification will resolve.
  if (loading) {
    return <LoadingScreen />;
  }

  if (!token || !sessionVerified) {
    return <Navigate to={signInPath} state={{ from: location }} replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/member/home" replace />;
  }

  if (requiredRole === "member" && !isMember) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <Outlet />;
}
