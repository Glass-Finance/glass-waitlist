import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ── Landing pages ──────────────────────────────────────────────────────────────
import OrganizationsHome from "./pages/OrganizationsHome";
import MembersHome from "./pages/MembersHome";
import InviteLanding from "./pages/InviteLanding";

// ── Auth pages ─────────────────────────────────────────────────────────────────
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CheckEmail from "./pages/auth/member/CheckEmail";
import Join from "./pages/auth/member/Join";

// ── Onboarding pages ───────────────────────────────────────────────────────────
import ChoosePath from "./pages/onboarding/ChoosePath";
import PayingMember from "./pages/onboarding/PayingMember";
import OrganizationProfile from "./pages/onboarding/OrganizationProfile";
import PaymentProfile from "./pages/onboarding/PaymentProfile";
import AddMembers from "./pages/onboarding/AddMembers";
import DesktopRequired from "./pages/onboarding/DesktopRequired";

// ── Admin dashboard layout + pages ────────────────────────────────────────────
import DashboardLayout from "./layouts/DashboardLayout";
import CommunitiesHome from "./pages/dashboard/CommunitiesHome";
import AdminDashboard, {
  PayingAdminDashboard,
} from "./pages/dashboard/AdminDashboard";
import Payments from "./pages/dashboard/Payments";
import Members from "./pages/dashboard/Members";
import MemberDetail from "./pages/dashboard/MemberDetail";
import AdminNotifications from "./pages/dashboard/Notifications";
import PaymentCallback from "./pages/dashboard/PaymentCallback";

// ── Settings ───────────────────────────────────────────────────────────────────
import Settings from "./pages/dashboard/settings/Settings";
import Profile from "./pages/dashboard/settings/account/Profile";
import Role from "./pages/dashboard/settings/account/Role";
import NotificationSettings from "./pages/dashboard/settings/account/Notifications";
import Security from "./pages/dashboard/settings/account/Security";
import PaymentMethod from "./pages/dashboard/settings/finance/PaymentMethod";
import AutoPay from "./pages/dashboard/settings/finance/AutoPay";
import PaystackAccount from "./pages/dashboard/settings/finance/PaystackAccount";
import CommunityProfile from "./pages/dashboard/settings/community/CommunityProfile";
import MemberAccess from "./pages/dashboard/settings/community/MemberAccess";
import SystemConfig from "./pages/dashboard/settings/admin/SystemConfig";
import AdminPanel from "./pages/dashboard/AdminPanel";

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
import MemberProfile from "./pages/memberApp/settings/account/Profile";
import MyCommunities from "./pages/memberApp/settings/communities/MyCommunities";
import MemberSecurity from "./pages/memberApp/settings/account/Security";
import MemberPassword from "./pages/memberApp/settings/account/Password";
import MemberTwoFactorAuth from "./pages/memberApp/settings/account/TwoFactorAuth";
import MemberAutoPay from "./pages/memberApp/settings/payments/AutoPay";
import MemberSavedCards from "./pages/memberApp/settings/payments/SavedCards";
import MemberNotificationSettings from "./pages/memberApp/settings/account/Notifications";

// ── Guards ───────────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";
import MemberProtectedRoute from "./routes/MemberProtectedRoute";
import MemberDeviceGuard from "./routes/MemberDeviceGuard";
import DesktopDeviceGuard from "./routes/DesktopDeviceGuard";
import MobileRequired from "./pages/auth/member/MobileRequired";

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public landing ── */}
        <Route path="/" element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ── Invite deep-link — not device-gated so email links work on any
            device. Backend's "Review Invite" email button links to
            /invites?inviteId=... (plural) — the singular /invite alias is
            kept in case anything else already points at it. ── */}
        <Route path="/invites" element={<InviteLanding />} />
        <Route path="/invite" element={<InviteLanding />} />

        {/* ── Auth ──
            /sign-up is the COMMUNITY OWNER entry point (desktop-first,
            never device-gated). /member/join is the MEMBER registration
            entry point — joining is mobile-only, so it's hard-gated here.
            SignIn/ForgotPassword/ResetPassword are each reachable from two
            routes (no "/member" prefix vs "/member/...") for the admin- and
            member-facing entry points that link to them respectively (the
            admin guard/Sidebar logout vs Join's link/the member
            guard/memberApp logout), but every route pair renders the *same*
            component — neither the page nor the login call itself knows in
            advance whether this is a community owner or a mobile-only
            member, only the resolved destination does (see
            resolveDestination in pages/auth/SignIn.jsx), and AuthLayout
            already adapts its chrome between desktop and mobile via CSS. ── */}
        <Route path="/sign-up" element={<SignUp />} />
        <Route element={<MemberDeviceGuard />}>
          <Route path="/member/join" element={<Join />} />
        </Route>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/member/app-sign-in" element={<SignIn />} />
        <Route path="/member/forgot-password" element={<ForgotPassword />} />
        <Route path="/member/reset-password" element={<ResetPassword />} />
        <Route path="/member/mobile-required" element={<MobileRequired />} />
        <Route path="/check-email" element={<CheckEmail />} />

        {/* ── Onboarding — desktop-only, fixed-width layout never adapted
            for mobile, so it's gated the same way the mobile-only member
            app is gated in the opposite direction (see DesktopDeviceGuard /
            MemberDeviceGuard). ── */}
        <Route path="/onboarding/desktop-required" element={<DesktopRequired />} />
        <Route element={<DesktopDeviceGuard />}>
          <Route path="/onboarding/choose-path" element={<ChoosePath />} />
          <Route path="/onboarding/paying-member" element={<PayingMember />} />
          <Route
            path="/onboarding/organization-profile"
            element={<OrganizationProfile />}
          />
          <Route
            path="/onboarding/payment-profile"
            element={<PaymentProfile />}
          />
          <Route path="/onboarding/members" element={<AddMembers />} />
        </Route>

        {/* ── Admin dashboard ── */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<CommunitiesHome />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/paying" element={<PayingAdminDashboard />} />
            <Route path="payments" element={<Payments />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:memberId" element={<MemberDetail />} />
            <Route path="notifications" element={<AdminNotifications />} />

            <Route path="system-config" element={<SystemConfig />} />
            <Route path="admin-panel" element={<AdminPanel />} />

            <Route path="settings" element={<Settings />}>
              <Route index element={<Navigate to="account" replace />} />

              {/* Account — bare path renders the menu list inside Settings.jsx */}
              <Route path="account" element={null} />
              <Route path="account/profile" element={<Profile />} />
              <Route path="account/role" element={<Role />} />
              <Route
                path="account/notifications"
                element={<NotificationSettings />}
              />
              <Route path="account/security" element={<Security />} />

              {/* Finance — bare path renders the menu list inside Settings.jsx */}
              <Route path="finance" element={null} />
              <Route
                path="finance/payment-methods"
                element={<PaymentMethod />}
              />
              <Route path="finance/auto-pay" element={<AutoPay />} />
              <Route path="finance/paystack" element={<PaystackAccount />} />

              {/* Community — bare path renders the menu list inside Settings.jsx */}
              <Route path="community" element={null} />
              <Route path="community/profile" element={<CommunityProfile />} />
              <Route
                path="community/member-access"
                element={<MemberAccess />}
              />
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
              <Route path="home" element={<MemberHome />} />
              <Route path="transactions" element={<MemberTransactions />} />
              <Route path="upcoming" element={<MemberUpcoming />} />
              <Route path="notifications" element={<MemberNotifications />} />
              <Route path="manage-payments" element={<ManagePayments />} />
              <Route path="pay/:paymentId" element={<PaymentSummary />} />
              <Route
                path="pay/:paymentId/success"
                element={<PaymentSuccess />}
              />
              <Route path="invites" element={<Invites />} />

              <Route path="settings" element={<MemberSettings />} />
              <Route path="profile" element={<MemberProfile />} />
              <Route path="communities" element={<MyCommunities />} />
              <Route path="security" element={<MemberSecurity />} />
              <Route path="security/password" element={<MemberPassword />} />
              <Route
                path="security/authentication"
                element={<MemberTwoFactorAuth />}
              />
              <Route path="auto-pay" element={<MemberAutoPay />} />
              <Route path="saved-cards" element={<MemberSavedCards />} />
              <Route
                path="notification-settings"
                element={<MemberNotificationSettings />}
              />
            </Route>
          </Route>
        </Route>

        {/* ── Payment callback — Paystack redirects here after checkout.
            Uses ProtectedRoute (no role) so both admin and member tokens
            are accepted. Not behind MemberDeviceGuard: the browser that
            completes the payment may be any browser, not just the member
            app's device. Desktop-designed for admin pay flow. ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/payment/callback" element={<PaymentCallback />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
