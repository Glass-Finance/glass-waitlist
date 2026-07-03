import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

/**
 * Requires only an authenticated session, no role check — community
 * admins/owners can also be paying members (see PayingAdminDashboard),
 * so the member app stays open to any logged-in user.
 */
export default function MemberProtectedRoute() {
  const location = useLocation();
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!token) {
    return <Navigate to="/member/app-sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
