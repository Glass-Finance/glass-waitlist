import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";

// ── Guards (eager — lightweight, needed for route resolution) ─────────────────
import ProtectedRoute from "./routes/ProtectedRoute";
import MemberProtectedRoute from "./routes/MemberProtectedRoute";
import MemberDeviceGuard from "./routes/MemberDeviceGuard";
import DesktopDeviceGuard from "./routes/DesktopDeviceGuard";
import SuperAdminRoute from "./routes/SuperAdminRoute";

// ── Landing pages ─────────────────────────────────────────────────────────────
const OrganizationsHome = lazy(() => import("./pages/OrganizationsHome"));
const MembersHome = lazy(() => import("./pages/MembersHome"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));

// ── Auth pages ────────────────────────────────────────────────────────────────
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const CheckEmail = lazy(() => import("./pages/auth/member/CheckEmail"));
const Join = lazy(() => import("./pages/auth/member/Join"));
const MobileRequired = lazy(() => import("./pages/auth/member/MobileRequired"));

// ── Onboarding pages ──────────────────────────────────────────────────────────
const ChoosePath = lazy(() => import("./pages/onboarding/ChoosePath"));
const PayingMember = lazy(() => import("./pages/onboarding/PayingMember"));
const OrganizationProfile = lazy(
  () => import("./pages/onboarding/OrganizationProfile"),
);
const PaymentProfile = lazy(() => import("./pages/onboarding/PaymentProfile"));
const AddMembers = lazy(() => import("./pages/onboarding/AddMembers"));
const DesktopRequired = lazy(
  () => import("./pages/onboarding/DesktopRequired"),
);

// ── Admin dashboard layout + pages ───────────────────────────────────────────
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const CommunitiesHome = lazy(() => import("./pages/dashboard/CommunitiesHome"));
const AdminDashboard = lazy(() => import("./pages/dashboard/AdminDashboard"));
const JoinRequests = lazy(() => import("./pages/dashboard/JoinRequests"));
const PayingAdminDashboard = lazy(() =>
  import("./pages/dashboard/AdminDashboard").then((m) => ({
    default: m.PayingAdminDashboard,
  })),
);
const Payments = lazy(() => import("./pages/dashboard/Payments"));
const Members = lazy(() => import("./pages/dashboard/Members"));
const MemberDetail = lazy(() => import("./pages/dashboard/MemberDetail"));
const AdminNotifications = lazy(
  () => import("./pages/dashboard/Notifications"),
);
const PaymentCallback = lazy(() => import("./pages/dashboard/PaymentCallback"));

// ── Settings ──────────────────────────────────────────────────────────────────
const Settings = lazy(() => import("./pages/dashboard/settings/Settings"));
const Profile = lazy(
  () => import("./pages/dashboard/settings/account/Profile"),
);
const Role = lazy(() => import("./pages/dashboard/settings/account/Role"));
const NotificationSettings = lazy(
  () => import("./pages/dashboard/settings/account/Notifications"),
);
const Security = lazy(
  () => import("./pages/dashboard/settings/account/Security"),
);
const PaymentMethod = lazy(
  () => import("./pages/dashboard/settings/finance/PaymentMethod"),
);
const AutoPay = lazy(
  () => import("./pages/dashboard/settings/finance/AutoPay"),
);
const PaystackAccount = lazy(
  () => import("./pages/dashboard/settings/finance/PaystackAccount"),
);
const CommunityProfile = lazy(
  () => import("./pages/dashboard/settings/community/CommunityProfile"),
);
const MemberAccess = lazy(
  () => import("./pages/dashboard/settings/community/MemberAccess"),
);
const SystemConfig = lazy(
  () => import("./pages/dashboard/settings/admin/SystemConfig"),
);
const AdminPanel = lazy(() => import("./pages/dashboard/AdminPanel"));

// ── Member app layout + pages ─────────────────────────────────────────────────
const MemberAppLayout = lazy(() => import("./layouts/MemberAppLayout"));
const MemberHome = lazy(() => import("./pages/memberApp/Home"));
const DiscoverCommunities = lazy(
  () => import("./pages/memberApp/DiscoverCommunities"),
);
const MemberTransactions = lazy(() => import("./pages/memberApp/Transactions"));
const MemberUpcoming = lazy(() => import("./pages/memberApp/UpcomingPayments"));
const MemberNotifications = lazy(
  () => import("./pages/memberApp/Notifications"),
);
const ManagePayments = lazy(() => import("./pages/memberApp/ManagePayments"));
const PaymentSummary = lazy(() => import("./pages/memberApp/PaymentSummary"));
const PaymentSuccess = lazy(() => import("./pages/memberApp/PaymentSuccess"));
const Invites = lazy(() => import("./pages/memberApp/Invites"));
const MemberSettings = lazy(
  () => import("./pages/memberApp/settings/Settings"),
);
const MemberProfile = lazy(
  () => import("./pages/memberApp/settings/account/Profile"),
);
const MyCommunities = lazy(
  () => import("./pages/memberApp/settings/communities/MyCommunities"),
);
const MemberSecurity = lazy(
  () => import("./pages/memberApp/settings/account/Security"),
);
const NotFound = lazy(() => import("./pages/NotFound"));
const MemberPassword = lazy(
  () => import("./pages/memberApp/settings/account/Password"),
);
const MemberTwoFactorAuth = lazy(
  () => import("./pages/memberApp/settings/account/TwoFactorAuth"),
);
const MemberAutoPay = lazy(
  () => import("./pages/memberApp/settings/payments/AutoPay"),
);
const MemberSavedCards = lazy(
  () => import("./pages/memberApp/settings/payments/SavedCards"),
);
const MemberNotificationSettings = lazy(
  () => import("./pages/memberApp/settings/account/Notifications"),
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
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
          <Route
            path="/onboarding/desktop-required"
            element={<DesktopRequired />}
          />
          <Route element={<DesktopDeviceGuard />}>
            <Route path="/onboarding/choose-path" element={<ChoosePath />} />
            <Route
              path="/onboarding/paying-member"
              element={<PayingMember />}
            />
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
              <Route path="join-requests" element={<JoinRequests />} />

              <Route element={<SuperAdminRoute />}>
                <Route path="system-config" element={<SystemConfig />} />
                <Route path="admin-panel" element={<AdminPanel />} />
              </Route>

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
                <Route
                  path="community/profile"
                  element={<CommunityProfile />}
                />
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
                <Route
                  path="communities/search"
                  element={<DiscoverCommunities />}
                />
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
          <Route element={<ProtectedRoute signInPath="/member/app-sign-in" />}>
            <Route path="/payment/callback" element={<PaymentCallback />} />
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
