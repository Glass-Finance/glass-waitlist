import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ── Landing pages ──────────────────────────────────────────────────────────────
import OrganizationsHome from "./pages/index";
import MembersHome from "./pages/membersHome";

// ── Auth pages ─────────────────────────────────────────────────────────────────
import MemberAuth from "./pages/auth/MemberAuth";
import CheckEmail from "./pages/auth/CheckEmail";

// ── Onboarding pages ───────────────────────────────────────────────────────────
import ChoosePath from "./pages/onboarding/ChoosePath";
import PayingMember from "./pages/onboarding/PayingMember";
import OrganizationProfile from "./pages/onboarding/OrganizationProfile";
import PaymentProfile from "./pages/onboarding/PaymentProfile";
import AddMembers from "./pages/onboarding/AddMembers";

// ── Dashboard layout + pages ───────────────────────────────────────────────────
import DashboardLayout from "./layouts/DashboardLayout";
import CommunitiesHome from "./pages/dashboard/CommunitiesHome";
import AdminDashboard, { PayingAdminDashboard } from "./pages/dashboard/AdminDashboard";

// ── Settings ───────────────────────────────────────────────────────────────────
import Settings from "./pages/dashboard/settings/Settings";
import Profile from "./pages/dashboard/settings/account/Profile";
import Role from "./pages/dashboard/settings/account/Role";
import Notifications from "./pages/dashboard/settings/account/Notifications";
import Security from "./pages/dashboard/settings/account/Security";
import PaymentMethod from "./pages/dashboard/settings/finance/PaymentMethod";
import AutoPay from "./pages/dashboard/settings/finance/AutoPay";
import Community from "./pages/dashboard/settings/community/Community";

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public landing ── */}
        <Route path="/" element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ── Auth ──
            /member/signup → Email → OTP → Complete Profile
                → /onboarding/choose-path
                    → [Create] → /onboarding/paying-member
                                    → /onboarding/organization-profile
                                    → /onboarding/payment-profile
                                    → /onboarding/members
                                    → /dashboard/home
                    → [Join]   → /check-email → /dashboard/home
        */}
        <Route path="/member/signup" element={<MemberAuth />} />
        <Route path="/check-email" element={<CheckEmail />} />

        {/* ── Onboarding ── */}
        <Route path="/onboarding/choose-path" element={<ChoosePath />} />
        <Route path="/onboarding/paying-member" element={<PayingMember />} />
        <Route path="/onboarding/organization-profile" element={<OrganizationProfile />} />
        <Route path="/onboarding/payment-profile" element={<PaymentProfile />} />
        <Route path="/onboarding/members" element={<AddMembers />} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<CommunitiesHome />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/paying" element={<PayingAdminDashboard />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />}>
            <Route index element={<Navigate to="account/profile" replace />} />
            <Route path="account/profile" element={<Profile />} />
            <Route path="account/role" element={<Role />} />
            <Route path="account/notifications" element={<Notifications />} />
            <Route path="account/security" element={<Security />} />
            <Route path="finance/payment-method" element={<PaymentMethod />} />
            <Route path="finance/auto-pay" element={<AutoPay />} />
            <Route path="community/profile" element={<Community />} />
          </Route>
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;