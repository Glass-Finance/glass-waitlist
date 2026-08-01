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
  const { token, isAdmin, isMember, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!token) {
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
