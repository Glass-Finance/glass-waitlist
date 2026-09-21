import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function PlatformAdminRoute() {
  const { token, user, sessionVerified, isPlatformAdmin, loading } = useAuth();

  if (loading || (token && !user)) return <LoadingScreen />;

  if (!token || !sessionVerified || !isPlatformAdmin) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <Outlet />;
}
