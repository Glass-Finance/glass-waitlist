import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ── Landing pages ──────────────────────────────────────────────────────────
import OrganizationsHome from "./pages/index";
import MembersHome       from "./pages/membersHome";

// ── Dashboard pages ────────────────────────────────────────────────────────
import CommunitiesHome   from "./pages/dashboard/CommunitiesHome";
import AdminDashboard    from "./pages/dashboard/AdminDashboard";
import PaymentsPage      from "./pages/dashboard/PaymentsPage";
// import MembersPage    from "./pages/dashboard/MembersPage";
// import SettingsPage   from "./pages/dashboard/SettingsPage";

// ── Auth pages (your partner's work) ──────────────────────────────────────
// import Login          from "./pages/auth/Login";
// import Register       from "./pages/auth/Register";
// import ForgotPassword from "./pages/auth/ForgotPassword";

// ── Other landing pages ────────────────────────────────────────────────────
// import Waitlist       from "./pages/Waitlist";
// import Ambassadors    from "./pages/Ambassadors";
// import FindCommunity  from "./pages/FindCommunity";

// ── Guards ─────────────────────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public landing ── */}
        <Route path="/"        element={<OrganizationsHome />} />
        <Route path="/members" element={<MembersHome />} />

        {/* ── Dashboard ── */}
        {/*
          Wrap all /dashboard/* routes with ProtectedRoute once auth is ready:
          <Route element={<ProtectedRoute />}>
            ...all dashboard routes here...
          </Route>
        */}
        <Route path="/dashboard/home"     element={<CommunitiesHome />} />
        <Route path="/dashboard"          element={<AdminDashboard />} />
        <Route path="/dashboard/payments" element={<PaymentsPage />} />
        {/* <Route path="/dashboard/members"  element={<MembersPage />} /> */}
        {/* <Route path="/dashboard/settings" element={<SettingsPage />} /> */}

        {/* ── Auth (uncomment when your partner is ready) ── */}
        {/* <Route path="/login"            element={<Login />} /> */}
        {/* <Route path="/register"         element={<Register />} /> */}
        {/* <Route path="/forgot-password"  element={<ForgotPassword />} /> */}

        {/* ── Other landing pages ── */}
        {/* <Route path="/waitlist"         element={<Waitlist />} /> */}
        {/* <Route path="/ambassadors"      element={<Ambassadors />} /> */}
        {/* <Route path="/find-community"   element={<FindCommunity />} /> */}

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;