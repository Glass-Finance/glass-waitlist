import { useState } from "react";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-5" : "left-0.5"}`} />
      <span className={`absolute top-0.5 text-[9px] font-bold transition-all ${on ? "left-1.5 text-white" : "right-1 text-gray-400"}`}>
        {on ? "On" : ""}
      </span>
    </button>
  );
}

function NotifRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

export default function Notifications() {
  const [notifs, setNotifs] = useState({
    paymentDue: true,
    paymentSuccess: true,
    paymentFailed: true,
    autoPay: true,
    newMember: true,
    memberPayment: true,
    memberPaymentFailed: true,
    newPlan: true,
  });

  const toggle = (key) => setNotifs((n) => ({ ...n, [key]: !n[key] }));

  return (
    <div className="max-w-2xl flex flex-col gap-5">

      {/* Payment notifications */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Payment notifications</p>
        <p className="text-xs text-gray-500 mb-2">Stay on top of dues, reminders, and collection activity.</p>
        <NotifRow label="Payment due reminder" description="Get notified 3 days before your dues are due" value={notifs.paymentDue} onChange={() => toggle("paymentDue")} />
        <NotifRow label="Payment successful" description="Confirmation when your payment goes through" value={notifs.paymentSuccess} onChange={() => toggle("paymentSuccess")} />
        <NotifRow label="Payment failed" description="Alert when a payment attempt is unsuccessful" value={notifs.paymentFailed} onChange={() => toggle("paymentFailed")} />
        <NotifRow label="Auto-Pay charged" description="Confirmation when Auto-Pay processes a charge" value={notifs.autoPay} onChange={() => toggle("autoPay")} />
      </div>

      {/* Community notifications */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Community notifications</p>
        <p className="text-xs text-gray-500 mb-2">Activity across your community.</p>
        <NotifRow label="New member joined" description="When someone accepts your invite and joins" value={notifs.newMember} onChange={() => toggle("newMember")} />
        <NotifRow label="Member payment received" description="When any member pays their dues" value={notifs.memberPayment} onChange={() => toggle("memberPayment")} />
        <NotifRow label="Member payment failed" description="When a member's payment attempt fails" value={notifs.memberPaymentFailed} onChange={() => toggle("memberPaymentFailed")} />
        <NotifRow label="New payment plan created" description="When a new plan is added to your community" value={notifs.newPlan} onChange={() => toggle("newPlan")} />
      </div>
    </div>
  );
}