import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

/**
 * IMPORTANT — same caveat as ProtectedRoute.jsx: confirm the literal value
 * of `platformRole` from a real /auth/login response before trusting the
 * `=== "member"` check below. If the backend returns a different casing
 * or a different enum string, every member will be redirected away from
 * the member app even with a valid session.
 */
export default function MemberProtectedRoute() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/member/sign-in" replace />;
  }

  if (user?.role !== "member") {
    return <Navigate to="/dashboard/home" replace />;
  }

  return <Outlet />;
}