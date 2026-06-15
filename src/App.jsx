import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ── Landing pages ──────────────────────────────────────────────────────────
import OrganizationsHome from "./pages/index";
import MembersHome from "./pages/membersHome";

// ── Auth pages ─────────────────────────────────────────────────────────────
import MemberAuth from "./pages/auth/MemberAuth";

// ── Onboarding pages ───────────────────────────────────────────────────────
import OrganizationProfile from "./pages/onboarding/OrganizationProfile";
import PaymentProfile from "./pages/onboarding/PaymentProfile";
import ChoosePath from "./pages/onboarding/ChoosePath";
import AddMembers from "./pages/onboarding/AddMembers";

// ── Dashboard layout + pages ───────────────────────────────────────────────
import DashboardLayout from "./layouts/DashboardLayout";
import CommunitiesHome from "./pages/dashboard/CommunitiesHome";
import AdminDashboard, { PayingAdminDashboard } from "./pages/dashboard/AdminDashboard";
// import PaymentsPage from "./pages/dashboard/PaymentsPage";
// import MemberDashboard from "./pages/dashboard/MemberDashboard";

// ── Settings ───────────────────────────────────────────────────────────────
import Settings from "./pages/dashboard/settings/Settings";
import Profile from "./pages/dashboard/settings/account/Profile";
import Role from "./pages/dashboard/settings/account/Role";
import Notifications from "./pages/dashboard/settings/account/Notifications";
import Security from "./pages/dashboard/settings/account/Security";

// ── Guards ─────────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public landing ── */}
        <Route path="/" element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ── Auth ── */}
        <Route path="/member/signup" element={<MemberAuth />} />

        {/* ── Onboarding ── */}
        <Route path="/onboarding/choose-path" element={<ChoosePath />} />
        <Route path="/onboarding/organization-profile" element={<OrganizationProfile />} />
        <Route path="/onboarding/payment-profile" element={<PaymentProfile />} />
        <Route path="/onboarding/members" element={<AddMembers />} />

        {/* ── Dashboard — all wrapped in DashboardLayout ── */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<CommunitiesHome />} />

          {/* Non-paying admin: sees stats + payment plans + member payments table */}
          <Route path="admin" element={<AdminDashboard />} />

          {/* Paying admin: same as above + alert banner + "Your Payments" table */}
          <Route path="paying-admin" element={<PayingAdminDashboard />} />

          {/* <Route path="payments" element={<PaymentsPage />} /> */}
          {/* <Route path="members" element={<MemberDashboard />} /> */}

          {/* Settings nested under dashboard */}
          <Route path="settings" element={<Settings />}>
            <Route index element={<Navigate to="account/profile" replace />} />
            <Route path="account/profile" element={<Profile />} />
            <Route path="account/role" element={<Role />} />
            <Route path="account/notifications" element={<Notifications />} />
            <Route path="account/security" element={<Security />} />
          </Route>
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;