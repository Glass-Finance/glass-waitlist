import SuccessBadge from "../../components/common/SuccessBadge";

// Dev-only visual QA page for SuccessBadge (not bundled in production —
// the route in App.jsx is gated on import.meta.env.DEV). Renders the
// badge in the same message/subMessage shapes its call sites use.
const USAGE_SITES = [
  "components/common/EmailChangeModal.jsx",
  "components/common/PhoneChangeModal.jsx",
  "components/common/SuccessBadge.jsx",
  "pages/dashboard/admin-dashboard/AddMemberModal.jsx",
  "pages/dashboard/PaymentCallback.jsx",
  "pages/dashboard/payments/CreatePlanModal.jsx",
  "pages/dashboard/Payments.jsx",
  "pages/dashboard/settings/account/Security.jsx",
  "pages/dashboard/settings/finance/PaystackAccount.jsx",
  "pages/memberApp/PaymentSuccess.jsx",
  "pages/memberApp/settings/account/TwoFactorAuth.jsx",
  "pages/memberApp/settings/account/UpdateEmail.jsx",
  "pages/memberApp/settings/account/VerifyPhone.jsx",
  "pages/onboarding/AddMembers.jsx",
  "pages/onboarding/PaymentProfile.jsx",
];

function Panel({ label, children }) {
  return (
    <div className="border border-[#EFEFEF] rounded-2xl p-6 flex flex-col items-center bg-white">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 m-0 mb-4">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function SuccessPreview() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-black m-0">SuccessBadge preview</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Geometry extracted from Glass Design by AQ/FeedbackIcon/Success.png — refresh to replay
          the full sequence (seal pop → check draw → accent pops → text).
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Panel label="Default (message + subMessage)">
            <SuccessBadge
              message="Payment successful"
              subMessage="Your payment has been confirmed and recorded."
            />
          </Panel>
          <Panel label="Message only">
            <SuccessBadge message="Email updated" />
          </Panel>
          <Panel label="Delayed start (badgeDelay 1.2s)">
            <SuccessBadge message="Phone verified" badgeDelay={1.2} />
          </Panel>
        </div>

        <div className="mt-8 border border-[#EFEFEF] rounded-2xl p-6 bg-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 m-0 mb-3">
            Call sites ({USAGE_SITES.length})
          </p>
          <ul className="text-xs text-gray-600 m-0 pl-5 leading-relaxed">
            {USAGE_SITES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
