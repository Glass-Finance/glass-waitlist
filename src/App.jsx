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
import AdminDashboard, {
  PayingAdminDashboard,
} from "./pages/dashboard/AdminDashboard";

// ── Settings ───────────────────────────────────────────────────────────────────
import Settings from "./pages/dashboard/settings/Settings";
import Profile from "./pages/dashboard/settings/account/Profile";
import Role from "./pages/dashboard/settings/account/Role";
import Notifications from "./pages/dashboard/settings/account/Notifications";
import Security from "./pages/dashboard/settings/account/Security";
import PaymentMethod from "./pages/dashboard/settings/finance/PaymentMethod";
import AutoPay from "./pages/dashboard/settings/finance/AutoPay";
import Community from "./pages/dashboard/settings/community/Community";

// ── Member app layout + pages ──────────────────────────────────────────────────
import MemberAppLayout from "./layouts/MemberAppLayout";
import MemberHome from "./pages/members/Home";
import MemberTransactions from "./pages/members/Transactions";
import MemberUpcoming from "./pages/members/UpcomingPayments";
import MemberNotifications from "./pages/members/MemberNotifications";
import ManagePayments from "./pages/members/ManagePayments";
import PaymentSummary from "./pages/members/PaymentSummary";
import PaymentSuccess from "./pages/members/PaymentSuccess";
import Invites from "./pages/members/Invites";

// ── Guards ─────────────────────────────────────────────────────────────────────
// import ProtectedRoute from "./routes/ProtectedRoute";
// import MemberProtectedRoute from "./routes/MemberProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public landing ── */}
        <Route path="/" element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ────────────────────────────────────────────────────────────────────
          AUTH
          Three entry points for member signup:

          1. Desktop organic:    /member/signup   → MemberAuth (desktop form)
          2. Mobile organic:     /member/join      → MobileSignUp (no token)
          3. Invite link:        /member/join?token=<jwt> → MobileSignUp
                                  token auto-consumed after profile step
                                  → navigates to /member/home directly

          Sign in (returning members):
                                 /member/sign-in  → MobileSignIn
        ───────────────────────────────────────────────────────────────────────
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
        <Route path="/member/join" element={<MobileSignUp />} />
        <Route path="/member/sign-in" element={<MobileSignIn />} />
        <Route path="/check-email" element={<CheckEmail />} />

        {/* ── Onboarding ── */}
        <Route path="/onboarding/choose-path" element={<ChoosePath />} />
        <Route path="/onboarding/paying-member" element={<PayingMember />} />
        <Route path="/onboarding/organization-profile" element={<OrganizationProfile />} />
        <Route path="/onboarding/payment-profile" element={<PaymentProfile />} />
        <Route path="/onboarding/members" element={<AddMembers />} />

        {/* ── Admin dashboard — wrapped in DashboardLayout ── */}
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
          </Route>
        </Route>

        {/* ────────────────────────────────────────────────────────────────────
          MEMBER APP — wrapped in MemberAppLayout (390px centred shell +
          bottom nav). All pages here are mobile-first.

          Bottom nav tabs:
            Home          /member/home
            Transactions  /member/transactions
            Upcoming      /member/upcoming
            Notifications /member/notifications

          Other member pages (no bottom nav, back-arrow header):
            Manage Payments   /member/manage-payments
            Pay               /member/pay/:paymentId
            Payment Success   /member/pay/:paymentId/success
            Profile           /member/profile  (placeholder — design pending)

          Wrap with <MemberProtectedRoute> once auth guards are ready.
        ─────────────────────────────────────────────────────────────────────── */}
        <Route path="/member" element={<MemberAppLayout />}>
          <Route index element={<Navigate to="home" replace />} />

          {/* Bottom nav pages */}
          <Route path="home" element={<MemberHome />} />
          <Route path="transactions" element={<MemberTransactions />} />
          <Route path="upcoming" element={<MemberUpcoming />} />
          <Route path="notifications" element={<MemberNotifications />} />

          {/* Full-screen sub-pages (back-arrow header, no bottom nav needed) */}
          <Route path="manage-payments" element={<ManagePayments />} />
          <Route path="pay/:paymentId" element={<PaymentSummary />} />
          <Route path="pay/:paymentId/success" element={<PaymentSuccess />} />

          {/* Profile — placeholder until UI designer delivers */}
          {/* <Route path="profile" element={<MemberProfile />} /> */}
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
