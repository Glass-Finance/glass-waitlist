import { useState } from "react";

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

export default function AutoPay() {
  const [plans, setPlans] = useState([
    { id: 1, name: "School fees support",     community: "Kings College Lagos", amount: "₦5,000",  frequency: "monthly", next: "Apr 1",      on: true },
    { id: 2, name: "Infrastructure development", community: "Kings College Lagos", amount: "₦10,000", frequency: "yearly",  next: "Jan 2026", on: true },
    { id: 3, name: "Alumni annual dues",      community: "UNILAG Alumni",       amount: "₦12,000", frequency: "yearly",  next: "Jan 2026", on: true },
  ]);

  const toggle = (id) =>
    setPlans(plans.map(p => p.id === id ? { ...p, on: !p.on } : p));

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">
        <div>
            <p className="text-xs font-medium text-gray-900 mb-0.5">Auto-Pay plans</p>
            <p className="text-xs text-gray-500">
                Manage automatic payments for your personal dues across all communities.
            </p>
        </div>
    <div className="bg-[#f6f6f8] rounded-lg p-6" style={{ border: "1px solid #f6f6f8" }}>
        <div className="flex flex-col">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="text-[13px] font-medium text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan.community} · {plan.amount} {plan.frequency} · Next: {plan.next}
                </p>
              </div>
              <Toggle on={plan.on} onChange={() => toggle(plan.id)}/>
            </div>
            
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-md"
        style={{ background: "#D7E2FF", border: "1px solid #002FA7" }}
      >
        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0  border border-[#002FA7]">
          <span className="text-[#002FA7] text-[9px] font-bold">i</span>
        </div>
        <p className="text-xs text-gray-700">
          Auto-Pay charges your default card on the due date. You'll receive a notification 3 days before each charge.
        </p>
      </div>
    </div>
  );
}