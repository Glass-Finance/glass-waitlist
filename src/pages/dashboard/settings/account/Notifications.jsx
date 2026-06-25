import { useNotificationPreferences } from "../../../../hooks/useNotifications";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
    >
      <div
        className={`relative w-8 h-[20px] rounded-full transition-all duration-300 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}
      >
        <div
          className={`absolute top-0.75 w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[16px]" : "left-0.5"}`}
        />
      </div>
      <span className={`text-xs font-medium ${on ? "text-gray-600" : "text-gray-400"}`}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

function NotifRow({ label, description, value, onChange, last = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

export default function Notifications() {
  const { preferences, isLoading, update } = useNotificationPreferences();

  // Defaults to "on" until preferences load, matching the previous behaviour
  const get = (key) => preferences[key] ?? true;

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {isLoading && <p className="text-xs text-gray-400">Loading…</p>}

      {/* Payment notifications */}
      <div className="bg-[#EFEFF1] rounded-2xl px-5 pt-4 pb-1" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Payment notifications</p>
        <p className="text-xs text-gray-500 mb-4">Stay on top of dues, reminders, and collection activity.</p>
        <NotifRow label="Payment due reminder"  description="Get notified 3 days before your dues are due"   value={get("paymentDue")}     onChange={(v) => update("paymentDue", v)}     />
        <NotifRow label="Payment successful"    description="Confirmation when your payment goes through"    value={get("paymentSuccess")} onChange={(v) => update("paymentSuccess", v)} />
        <NotifRow label="Payment failed"        description="Alert when a payment attempt is unsuccessful"   value={get("paymentFailed")}  onChange={(v) => update("paymentFailed", v)}  />
        <NotifRow label="Auto-Pay charged"      description="Confirmation when Auto-Pay processes a charge" value={get("autoPay")}        onChange={(v) => update("autoPay", v)}        last />
      </div>

      {/* Community notifications */}
      <div className="bg-[#EFEFF1] rounded-2xl px-5 pt-4 pb-1" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Community notifications</p>
        <p className="text-xs text-gray-500 mb-1">Activity across your community.</p>
        <NotifRow label="New member joined"        description="When someone accepts your invite and joins"  value={get("newMember")}           onChange={(v) => update("newMember", v)}           />
        <NotifRow label="Member payment received"  description="When any member pays their dues"             value={get("memberPayment")}       onChange={(v) => update("memberPayment", v)}       />
        <NotifRow label="Member payment failed"    description="When a member's payment attempt fails"       value={get("memberPaymentFailed")} onChange={(v) => update("memberPaymentFailed", v)} />
        <NotifRow label="New payment plan created" description="When a new plan is added to your community"  value={get("newPlan")}             onChange={(v) => update("newPlan", v)}             last />
      </div>
    </div>
  );
}
