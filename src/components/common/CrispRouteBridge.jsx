import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Crisp } from "crisp-sdk-web";

// Router-aware half of the support chat (the chat itself lives outside the
// router in main.jsx, so visibility/page context need this in-router bridge).
//
// Crisp's per-page settings only apply on full page loads — in an SPA we
// have to re-apply visibility on every route change.

// Pages where the widget must NOT be visible: users enter bank details,
// card data, or identity documents here, and a visible chat invites pasting
// them into a third-party log. (Support will never ask for these anyway —
// that's stated in the dashboard welcome message.)
const SENSITIVE_PREFIXES = [
  "/onboarding/payment-profile", // bank/account details
  "/dashboard/verify-identity", // KYC document upload (+ /history)
  "/member/verify-identity",
  "/member/pay", // payment flow (+ /:paymentId, /success)
  "/payment/callback", // Paystack return with payment context
  "/dashboard/finance/payment-methods",
  "/member/saved-cards",
];

const isSensitive = (path) =>
  SENSITIVE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

export default function CrispRouteBridge() {
  const { pathname } = useLocation();
  const websiteId = import.meta.env.VITE_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!websiteId) return;

    if (isSensitive(pathname)) Crisp.chat.hide();
    else Crisp.chat.show();

    // Agent context: which page the visitor is on. Debounced so rapid
    // navigation doesn't fire a session-data write per keystroke of travel.
    const t = setTimeout(() => {
      Crisp.session.setData({ page: pathname });
    }, 400);
    return () => clearTimeout(t);
  }, [pathname, websiteId]);

  return null;
}
