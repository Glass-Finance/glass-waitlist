import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import GlassLogo from "../assets/Glass.png";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[1.5px] border-[#1C2B8A]/10 border-t-[#1C2B8A] animate-spin" />
        <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" decoding="async" loading="lazy" />
      </div>
    </div>
  );
}

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
