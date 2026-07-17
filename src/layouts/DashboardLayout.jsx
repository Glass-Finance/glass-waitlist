import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import DashboardTour, { DASHBOARD_TOUR_SEEN_KEY } from "../components/dashboard/DashboardTour";
import Background from "../assets/background.webp";

export default function DashboardLayout() {
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

  return (
    <div
      className="h-screen w-screen flex overflow-hidden bg-surface-bg"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ── Sidebar ── */}
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onOpenTour={() => setTourOpen(true)} />

        {/* Page content — background texture lives on the outer container
            above so every dashboard page gets it uniformly, instead of each
            page applying its own copy on a div sized to its own content
            (h-full there only fills the content's own height, leaving a
            plain gray gap below on shorter pages like Settings). */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {tourOpen && <DashboardTour onClose={closeTour} />}
    </div>
  );
}
