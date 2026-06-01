import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 * ──────────────
 * Wraps any route that requires the user to be authenticated.
 *
 * How it works:
 * 1. Reads the auth token from localStorage (swap for your auth context/store
 *    once your partner's auth is wired up).
 * 2. If no token → redirects to /login, passing the attempted URL in state
 *    so after login the user lands back where they tried to go.
 * 3. If token exists → renders <Outlet /> (the protected child route).
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard"          element={<AdminDashboard />} />
 *     <Route path="/dashboard/payments" element={<PaymentsPage />} />
 *     <Route path="/dashboard/members"  element={<MembersPage />} />
 *     <Route path="/dashboard/settings" element={<SettingsPage />} />
 *   </Route>
 *
 * Role-based usage (optional — pass required role as prop):
 *   <Route element={<ProtectedRoute requiredRole="admin" />}>
 *     <Route path="/dashboard" element={<AdminDashboard />} />
 *   </Route>
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * getAuthToken
 * Reads token from localStorage.
 * Swap this out for your auth context once it's ready:
 *   import { useAuth } from "../context/AuthContext";
 *   const { token } = useAuth();
 */
function getAuthToken() {
  return localStorage.getItem("glass_token") || null;
}

/**
 * getUserRole
 * Reads the user role from localStorage.
 * Replace with your auth context when ready.
 * Expected values: "admin" | "member"
 */
function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("glass_user") || "{}");
    return user?.role || null;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProtectedRoute({ requiredRole = null }) {
  const location = useLocation();
  const token    = getAuthToken();
  const role     = getUserRole();

  // ── Not logged in → go to login, remember where they were trying to go ──
  if (!token) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ── Logged in but wrong role → redirect to their own dashboard ──
  if (requiredRole && role !== requiredRole) {
    const fallback = role === "member" ? "/member-dashboard" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  // ── Authenticated & authorized → render the child route ──
  return <Outlet />;
}   