// import { useState } from "react";

// function Toggle({ on, onChange }) {
//   return (
//     <button
//       onClick={() => onChange(!on)}
//       className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}
//     >
//       <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-5" : "left-0.5"}`} />
     
//     </button>
//   );
// }

// function NotifRow({ label, description, value, onChange, border = true }) {
//   return (
//     <div
//       className="flex items-center justify-between py-4"
//     >
      
//       <div>
//         <p className="text-sm font-medium text-gray-900">{label}</p>
//         <p className="text-xs text-gray-500 mt-0.5">{description}</p>
//       </div>
//       <Toggle on={value} onChange={onChange} />

//     </div>
//   );
// }

// export default function Notifications() {
//   const [notifs, setNotifs] = useState({
//     paymentDue:          true,
//     paymentSuccess:      true,
//     paymentFailed:       true,
//     autoPay:             true,
//     newMember:           true,
//     memberPayment:       true,
//     memberPaymentFailed: true,
//     newPlan:             true,
//   });

//   const toggle = (key) => setNotifs(n => ({ ...n, [key]: !n[key] }));

//   return (
//     <div className="flex flex-col gap-5 max-w-3xl w-full">

//       {/* Payment notifications */}
//       <div className="bg-white rounded-2xl px-6 pt-5 pb-1" style={{ border: "1px solid #E5E7EB" }}>
//         <p className="text-sm font-semibold text-gray-900 mb-0.5">Payment notifications</p>
//         <p className="text-xs text-gray-500 mb-2">Stay on top of dues, reminders, and collection activity.</p>
//         <NotifRow label="Payment due reminder"  description="Get notified 3 days before your dues are due"       value={notifs.paymentDue}     onChange={() => toggle("paymentDue")}     />
//         <NotifRow label="Payment successful"    description="Confirmation when your payment goes through"        value={notifs.paymentSuccess} onChange={() => toggle("paymentSuccess")} />
//         <NotifRow label="Payment failed"        description="Alert when a payment attempt is unsuccessful"       value={notifs.paymentFailed}  onChange={() => toggle("paymentFailed")}  />
//         <NotifRow label="Auto-Pay charged"      description="Confirmation when Auto-Pay processes a charge"     value={notifs.autoPay}        onChange={() => toggle("autoPay")}        border={false} />
//       </div>

//       {/* Community notifications */}
//       <div className="bg-white rounded-2xl px-6 pt-5 pb-1" style={{ border: "1px solid #E5E7EB" }}>
//         <p className="text-sm font-semibold text-gray-900 mb-0.5">Community notifications</p>
//         <p className="text-xs text-gray-500 mb-2">Activity across your community.</p>
//         <NotifRow label="New member joined"        description="When someone accepts your invite and joins"      value={notifs.newMember}           onChange={() => toggle("newMember")}           />
//         <NotifRow label="Member payment received"  description="When any member pays their dues"                 value={notifs.memberPayment}       onChange={() => toggle("memberPayment")}       />
//         <NotifRow label="Member payment failed"    description="When a member's payment attempt fails"           value={notifs.memberPaymentFailed} onChange={() => toggle("memberPaymentFailed")} />
//         <NotifRow label="New payment plan created" description="When a new plan is added to your community"      value={notifs.newPlan}             onChange={() => toggle("newPlan")}             border={false} />
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import background from "../../../../assets/background.png"

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
    <div
      className="flex items-center justify-between py-2"
    >
      <div>
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

export default function Notifications() {
  const [notifs, setNotifs] = useState({
    paymentDue:          true,
    paymentSuccess:      true,
    paymentFailed:       true,
    autoPay:             true,
    newMember:           true,
    memberPayment:       true,
    memberPaymentFailed: true,
    newPlan:             true,
  });

  const toggle = (key) => setNotifs(n => ({ ...n, [key]: !n[key] }));

  return (
    <div className="flex flex-col gap-4 max-w-4xl" style={{backgroundImage: `url(${background})` , backgroundRepeat: "no-repeat", backgroundPosition: "auto", backgroundSize: "contain"}}>
      {/* Payment notifications */}
      <div className="bg-[#EFEFF1] rounded-2xl px-5 pt-4 pb-1" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Payment notifications</p>
        <p className="text-xs text-gray-500 mb-4">Stay on top of dues, reminders, and collection activity.</p>
        <NotifRow label="Payment due reminder"  description="Get notified 3 days before your dues are due"   value={notifs.paymentDue}     onChange={() => toggle("paymentDue")}     />
        <NotifRow label="Payment successful"    description="Confirmation when your payment goes through"    value={notifs.paymentSuccess} onChange={() => toggle("paymentSuccess")} />
        <NotifRow label="Payment failed"        description="Alert when a payment attempt is unsuccessful"   value={notifs.paymentFailed}  onChange={() => toggle("paymentFailed")}  />
        <NotifRow label="Auto-Pay charged"      description="Confirmation when Auto-Pay processes a charge" value={notifs.autoPay}        onChange={() => toggle("autoPay")}        last />
      </div>

      {/* Community notifications */}
      <div className="bg-[#EFEFF1] rounded-2xl px-5 pt-4 pb-1" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Community notifications</p>
        <p className="text-xs text-gray-500 mb-1">Activity across your community.</p>
        <NotifRow label="New member joined"        description="When someone accepts your invite and joins"  value={notifs.newMember}           onChange={() => toggle("newMember")}           />
        <NotifRow label="Member payment received"  description="When any member pays their dues"             value={notifs.memberPayment}       onChange={() => toggle("memberPayment")}       />
        <NotifRow label="Member payment failed"    description="When a member's payment attempt fails"       value={notifs.memberPaymentFailed} onChange={() => toggle("memberPaymentFailed")} />
        <NotifRow label="New payment plan created" description="When a new plan is added to your community"  value={notifs.newPlan}             onChange={() => toggle("newPlan")}             last />
      </div>

    </div>
  );
}