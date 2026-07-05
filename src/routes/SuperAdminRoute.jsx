import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

const SUPER_ADMIN_EMAIL = "glasspayhq@gmail.com";

export default function SuperAdminRoute() {
  const { token, user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!token || user?.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <Outlet />;
}
