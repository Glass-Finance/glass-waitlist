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
import SignUp from "./pages/auth/admin/SignUp";
import SignIn from "./pages/auth/admin/SignIn";
import CheckEmail from "./pages/auth/member/CheckEmail";
import Join from "./pages/auth/member/Join";
import MemberAppSignIn from "./pages/auth/member/SignIn";

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
import Members from "./pages/dashboard/Members";
import MemberDetail from "./pages/dashboard/MemberDetail";
import AdminNotifications from "./pages/dashboard/Notifications";

// ── Settings ───────────────────────────────────────────────────────────────────
import Settings from "./pages/dashboard/settings/Settings";
import Profile from "./pages/dashboard/settings/account/Profile";
import Role from "./pages/dashboard/settings/account/Role";
import NotificationSettings from "./pages/dashboard/settings/account/NotificationSettings";
import Security from "./pages/dashboard/settings/account/Security";
import PaymentMethod from "./pages/dashboard/settings/finance/PaymentMethod";
import AutoPay from "./pages/dashboard/settings/finance/AutoPay";
import PaystackAccount from "./pages/dashboard/settings/finance/PaystackAccount";
import CommunityProfile from "./pages/dashboard/settings/community/CommunityProfile";
import MemberAccess from "./pages/dashboard/settings/community/MemberAccess";

// ── Member app layout + pages ──────────────────────────────────────────────────
import MemberAppLayout from "./layouts/MemberAppLayout";
import MemberHome from "./pages/memberApp/Home";
import MemberTransactions from "./pages/memberApp/Transactions";
import MemberUpcoming from "./pages/memberApp/UpcomingPayments";
import MemberNotifications from "./pages/memberApp/Notifications";
import ManagePayments from "./pages/memberApp/ManagePayments";
import PaymentSummary from "./pages/memberApp/PaymentSummary";
import PaymentSuccess from "./pages/memberApp/PaymentSuccess";
import Invites from "./pages/memberApp/Invites";
import MemberSettings from "./pages/memberApp/settings/Settings";
import MemberProfile from "./pages/memberApp/settings/Profile";
import MyCommunities from "./pages/memberApp/settings/MyCommunities";
import MemberSecurity from "./pages/memberApp/settings/Security";
import MemberPassword from "./pages/memberApp/settings/Password";
import MemberTwoFactorAuth from "./pages/memberApp/settings/TwoFactorAuth";
import MemberAutoPay from "./pages/memberApp/settings/AutoPay";
import MemberNotificationSettings from "./pages/memberApp/settings/NotificationSettings";

// ── Guards ───────────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";
import MemberProtectedRoute from "./routes/MemberProtectedRoute";
import MemberDeviceGuard from "./routes/MemberDeviceGuard";
import MobileRequired from "./pages/auth/member/MobileRequired";

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public landing ── */}
        <Route path="/" element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ── Auth ──
            /member/signup is the COMMUNITY OWNER entry point (desktop-first,
            never device-gated). /member/join is the MEMBER registration
            entry point — joining is mobile-only, so it's hard-gated here.
            /member/sign-in is the desktop-styled login, used by admin-facing
            entry points (the admin guard, Sidebar logout, SignUp's "Already
            have an account" link). /member/app-sign-in is the mobile-card
            login shared by member-facing entry points (Join's link, the
            member guard, memberApp logout) — it's reachable on any device,
            but auth/member/SignIn.jsx redirects non-admin desktop logins to the
            QR handoff after authenticating, since only the *resulting role*
            tells us which experience the user actually needs. ── */}
        <Route path="/member/signup"  element={<SignUp />} />
        <Route element={<MemberDeviceGuard />}>
          <Route path="/member/join" element={<Join />} />
        </Route>
        <Route path="/member/sign-in"     element={<SignIn />} />
        <Route path="/member/app-sign-in" element={<MemberAppSignIn />} />
        <Route path="/member/mobile-required" element={<MobileRequired />} />
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
            <Route path="payments"           element={<Payments />} />
            <Route path="members"            element={<Members />} />
            <Route path="members/:memberId"  element={<MemberDetail />} />
            <Route path="notifications"      element={<AdminNotifications />} />

            <Route path="settings" element={<Settings />}>
              <Route index element={<Navigate to="account" replace />} />

              {/* Account — bare path renders the menu list inside Settings.jsx */}
              <Route path="account"               element={null} />
              <Route path="account/profile"       element={<Profile />} />
              <Route path="account/role"          element={<Role />} />
              <Route path="account/notifications" element={<NotificationSettings />} />
              <Route path="account/security"      element={<Security />} />

              {/* Finance — bare path renders the menu list inside Settings.jsx */}
              <Route path="finance"                 element={null} />
              <Route path="finance/payment-methods" element={<PaymentMethod />} />
              <Route path="finance/auto-pay"        element={<AutoPay />} />
              <Route path="finance/paystack"        element={<PaystackAccount />} />

              {/* Community — bare path renders the menu list inside Settings.jsx */}
              <Route path="community"               element={null} />
              <Route path="community/profile"       element={<CommunityProfile />} />
              <Route path="community/member-access" element={<MemberAccess />} />
            </Route>
          </Route>
        </Route>

        {/* ── Member app ──
            Mobile-only by design (never device-gated): direct URL access,
            old bookmarks, or links shared into a desktop chat all get the
            QR handoff instead of a half-responsive layout. ── */}
        <Route element={<MemberDeviceGuard />}>
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

              <Route path="settings"                       element={<MemberSettings />} />
              <Route path="profile"                        element={<MemberProfile />} />
              <Route path="communities"                    element={<MyCommunities />} />
              <Route path="security"                       element={<MemberSecurity />} />
              <Route path="security/password"              element={<MemberPassword />} />
              <Route path="security/authentication"        element={<MemberTwoFactorAuth />} />
              <Route path="auto-pay"                        element={<MemberAutoPay />} />
              <Route path="notification-settings"           element={<MemberNotificationSettings />} />
            </Route>
          </Route>
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;