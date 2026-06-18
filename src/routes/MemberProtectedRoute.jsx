// routes/MemberProtectedRoute.jsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export default function MemberProtectedRoute() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return (
      <Navigate
        to="/member/sign-in"
        replace
      />
    );
  }

  if (user?.role !== "member") {
    return (
      <Navigate
        to="/dashboard/home"
        replace
      />
    );
  }

  return <Outlet />;
}