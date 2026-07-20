import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import DashboardTour, { DASHBOARD_TOUR_SEEN_KEY } from "../components/dashboard/DashboardTour";
import AutoPayPrompt from "../components/common/AutoPayPrompt";
import AdminBackground from "../assets/admin-background.webp";

export default function DashboardLayout() {
  const navigate = useNavigate();
  // Sidebar is an off-canvas drawer below the md breakpoint (see
  // Sidebar.jsx) -- this state is lifted here since the hamburger that
  // opens it lives in the sibling Topbar, not Sidebar itself.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-show the first-launch walkthrough once per browser; the help icon
  // in Topbar lets it be replayed on demand afterward.
  useEffect(() => {
    try {
      if (!localStorage.getItem(DASHBOARD_TOUR_SEEN_KEY)) setTourOpen(true);
    } catch {
      // localStorage unavailable (e.g. private browsing) — just skip the tour
    }
  }, []);

  function closeTour() {
    setTourOpen(false);
    try { localStorage.setItem(DASHBOARD_TOUR_SEEN_KEY, "1"); } catch {}
  }

  // Auto-Pay prompt handoff for the redirect-based (Paystack-hosted) admin
  // payment path -- AdminPaymentCallback stashes this once verification
  // lands on success (see its own maybeOfferAutoPay), since the admin can
  // land back on any /dashboard/* route depending on where they paid from
  // (AdminDashboard's own "Your Payments", or CommunitiesHome's
  // cross-community overview) -- this layout wraps both, so reading it here
  // once covers every landing page instead of duplicating the same
  // read-on-mount logic in each page. Read once on mount and consume
  // immediately so a refresh/re-visit doesn't reopen it.
  const [autoPayPrompt, setAutoPayPrompt] = useState(() => {
    try {
      const raw = sessionStorage.getItem("glass_autopay_prompt_admin");
      if (!raw) return null;
      sessionStorage.removeItem("glass_autopay_prompt_admin");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  function dismissAutoPayPrompt() {
    if (autoPayPrompt?.paymentLinkId) {
      try {
        localStorage.setItem(`glass_autopay_asked_${autoPayPrompt.paymentLinkId}`, "1");
      } catch { /* ignore */ }
    }
    setAutoPayPrompt(null);
  }

  function enableAutoPay() {
    dismissAutoPayPrompt();
    navigate("/dashboard/settings/finance/auto-pay");
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-surface-bg">
      {/* ── Sidebar ── */}
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {/* ── Main ──
          Background lives on this inner wrapper (the area right of the
          sidebar) rather than the full-width outer container -- centering
          against the full w-screen width put the image's true center inside
          the sidebar's own footprint, which reads as shifted left relative
          to the actual visible content area. */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          backgroundImage: `url(${AdminBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Topbar */}
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onOpenTour={() => setTourOpen(true)} />

        {/* Page content — background texture lives on the wrapper above so
            every dashboard page gets it uniformly, instead of each page
            applying its own copy on a div sized to its own content (h-full
            there only fills the content's own height, leaving a plain gray
            gap below on shorter pages like Settings). */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {tourOpen && <DashboardTour onClose={closeTour} />}
      {autoPayPrompt && (
        <AutoPayPrompt
          prompt={autoPayPrompt}
          onDismiss={dismissAutoPayPrompt}
          onEnable={enableAutoPay}
        />
      )}
    </div>
  );
}
