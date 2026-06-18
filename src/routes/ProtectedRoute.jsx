import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

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
    return (
      <Navigate
        to={user?.role === "member" ? "/member/invites" : "/dashboard/home"}
        replace
      />
    );
  }

  return <Outlet />;
}
