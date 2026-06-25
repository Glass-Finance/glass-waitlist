import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ── Landing pages ──────────────────────────────────────────────────────────────
import OrganizationsHome from "./pages/OrganizationsHome";
import MembersHome from "./pages/MembersHome";

// ── Auth pages ─────────────────────────────────────────────────────────────────
import MemberAuth from "./pages/auth/MemberAuth";
import CheckEmail from "./pages/auth/CheckEmail";
import MobileSignUp from "./pages/auth/MobileSignUp";
import MobileSignIn from "./pages/auth/MobileSignIn";

// ── Onboarding pages ───────────────────────────────────────────────────────────
import ChoosePath from "./pages/onboarding/ChoosePath";
import PayingMember from "./pages/onboarding/PayingMember";
import OrganizationProfile from "./pages/onboarding/OrganizationProfile";
import PaymentProfile from "./pages/onboarding/PaymentProfile";
import AddMembers from "./pages/onboarding/AddMembers";

// ── Admin dashboard layout + pages ────────────────────────────────────────────
import DashboardLayout from "./layouts/DashboardLayout";
import CommunitiesHome from "./pages/dashboard/CommunitiesHome";
import AdminDashboard, { PayingAdminDashboard } from "./pages/dashboard/AdminDashboard";
import Payments from "./pages/dashboard/Payments";

// ── Settings ───────────────────────────────────────────────────────────────────
import Settings from "./pages/dashboard/settings/Settings";
import Profile from "./pages/dashboard/settings/account/Profile";
import Role from "./pages/dashboard/settings/account/Role";
import Notifications from "./pages/dashboard/settings/account/Notifications";
import Security from "./pages/dashboard/settings/account/Security";
import PaymentMethod from "./pages/dashboard/settings/finance/PaymentMethod";
import AutoPay from "./pages/dashboard/settings/finance/AutoPay";
import CommunityProfile from "./pages/dashboard/settings/community/CommunityProfile";
import MemberAccess from "./pages/dashboard/settings/community/MemberAccess";

// ── Member app layout + pages ──────────────────────────────────────────────────
import MemberAppLayout from "./layouts/MemberAppLayout";
import MemberHome from "./pages/memberApp/Home";
import MemberTransactions from "./pages/memberApp/Transactions";
import MemberUpcoming from "./pages/memberApp/UpcomingPayments";
import MemberNotifications from "./pages/memberApp/MemberNotifications";
import ManagePayments from "./pages/memberApp/ManagePayments";
import PaymentSummary from "./pages/memberApp/PaymentSummary";
import PaymentSuccess from "./pages/memberApp/PaymentSuccess";
import Invites from "./pages/memberApp/Invites";

// ── Guards ───────────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";
import MemberProtectedRoute from "./routes/MemberProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public landing ── */}
        <Route path="/" element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ── Auth ── */}
        <Route path="/member/signup"  element={<MemberAuth />} />
        <Route path="/member/join"    element={<MobileSignUp />} />
        <Route path="/member/sign-in" element={<MobileSignIn />} />
        <Route path="/check-email"    element={<CheckEmail />} />

        {/* ── Onboarding ── */}
        <Route path="/onboarding/choose-path"          element={<ChoosePath />} />
        <Route path="/onboarding/paying-member"        element={<PayingMember />} />
        <Route path="/onboarding/organization-profile" element={<OrganizationProfile />} />
        <Route path="/onboarding/payment-profile"      element={<PaymentProfile />} />
        <Route path="/onboarding/members"              element={<AddMembers />} />

        {/* ── Admin dashboard ── */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home"         element={<CommunitiesHome />} />
            <Route path="admin"        element={<AdminDashboard />} />
            <Route path="admin/paying" element={<PayingAdminDashboard />} />
            <Route path="payments"     element={<Payments />} />

            <Route path="settings" element={<Settings />}>
              <Route index element={<Navigate to="account/profile" replace />} />

              {/* Account */}
              <Route path="account"               element={<Navigate to="account/profile" replace />} />
              <Route path="account/profile"       element={<Profile />} />
              <Route path="account/role"          element={<Role />} />
              <Route path="account/notifications" element={<Notifications />} />
              <Route path="account/security"      element={<Security />} />

              {/* Finance — top level renders menu list inside Settings.jsx */}
              <Route path="finance/payment-methods" element={<PaymentMethod />} />
              <Route path="finance/auto-pay"        element={<AutoPay />} />

              {/* Community — top level renders menu list inside Settings.jsx */}
              <Route path="community/profile"       element={<CommunityProfile />} />
              <Route path="community/member-access" element={<MemberAccess />} />
            </Route>
          </Route>
        </Route>

        {/* ── Member app ── */}
        <Route element={<MemberProtectedRoute />}>
          <Route path="/member" element={<MemberAppLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home"          element={<MemberHome />} />
            <Route path="transactions"  element={<MemberTransactions />} />
            <Route path="upcoming"      element={<MemberUpcoming />} />
            <Route path="notifications" element={<MemberNotifications />} />
            <Route path="manage-payments"        element={<ManagePayments />} />
            <Route path="pay/:paymentId"         element={<PaymentSummary />} />
            <Route path="pay/:paymentId/success" element={<PaymentSuccess />} />
            <Route path="invites"                element={<Invites />} />
          </Route>
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;