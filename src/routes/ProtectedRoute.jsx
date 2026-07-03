import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

/**
 * requiredRole: "admin" | "member" | undefined
 * Role check uses isAdmin/isMember from AuthContext (derived from
 * platformRole via .includes("OWNER"|"ADMIN"|"MANAGER")) instead of an
 * exact string match, since the backend's exact platformRole casing/enum
 * isn't guaranteed and isAdmin/isMember is the single source of truth
 * already used by SignInStep's post-login redirect.
 */
export default function ProtectedRoute({ requiredRole }) {
  const location = useLocation();
  const { token, isAdmin, isMember, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!token) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/member/home" replace />;
  }

  if (requiredRole === "member" && !isMember) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <Outlet />;
}
