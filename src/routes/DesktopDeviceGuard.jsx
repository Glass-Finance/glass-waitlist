import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isMobileDevice, desktopRequiredPath } from "../utils/deviceRedirect";

/**
 * The owner-onboarding flow (ChoosePath, PayingMember, OrganizationProfile,
 * PaymentProfile, AddMembers) is a fixed-width desktop layout that was never
 * adapted for mobile. Mirrors MemberDeviceGuard.jsx for the opposite
 * direction: anyone reaching these routes on a phone gets a "continue on
 * desktop" screen instead of a broken fixed-width layout.
 *
 * Uses the raw isMobileDevice() check rather than a session-memoized
 * variant — this flow is a short, one-time linear path, not an ongoing
 * session, so the DevTools-emulation-on-reload edge case
 * isMobileSession() exists for doesn't apply here.
 */
export default function DesktopDeviceGuard() {
  const location = useLocation();

  if (isMobileDevice()) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={desktopRequiredPath(target)} replace />;
  }

  return <Outlet />;
}
