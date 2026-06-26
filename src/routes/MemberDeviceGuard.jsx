import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isMobileDevice, mobileRequiredPath } from "../utils/deviceRedirect";

/**
 * The member app (Home, Transactions, Upcoming, Notifications, Manage
 * Payments, Settings, etc.) is mobile-first by design — these screens are
 * never adapted for desktop. Anyone reaching them on a desktop, laptop, or
 * tablet (typed URL, bookmark, old link) gets a QR handoff instead, rather
 * than a broken or half-responsive layout.
 */
export default function MemberDeviceGuard() {
  const location = useLocation();

  if (!isMobileDevice()) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={mobileRequiredPath(target)} replace />;
  }

  return <Outlet />;
}
