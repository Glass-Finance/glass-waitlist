import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Info } from "lucide-react";

// ─── Mock data matching Figma ─────────────────────────────────────────────────
const MOCK = {
  community: { name: "Kings College Community", logo: null },
  card: { last4: "9718", expiry: "04/28", brand: "mastercard" },
  plan: {
    schedule: "Monthly",
    amount: 5000,
    charge: 100,
    total: 5100,
  },
  autoPay: true,
};

function fmt(n) {
  return "₦" + new Intl.NumberFormat("en-NG").format(n);
}

// ─── Mastercard icon ──────────────────────────────────────────────────────────
function MastercardIcon() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
      <rect width="32" height="20" rx="3" fill="white" />
      <circle cx="12" cy="10" r="7" fill="#EB001B" />
      <circle cx="20" cy="10" r="7" fill="#F79E1B" />
      <path d="M16 4.27a7 7 0 0 1 0 11.46A7 7 0 0 1 16 4.27z" fill="#FF5F00" />
    </svg>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative inline-flex items-center cursor-pointer"
      style={{ width: 44, height: 24 }}
      aria-checked={on}
      role="switch"
    >
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ background: on ? "#002FA7" : "#D1D5DB" }}
      />
      <span
        className="absolute w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: on ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Payment Summary screen ───────────────────────────────────────────────────
export default function PaymentSummary() {
  const navigate = useNavigate();
  const [autoPay, setAutoPay] = useState(MOCK.autoPay);
  const [loading, setLoading] = useState(false);
  const { community, card, plan } = MOCK;

  async function handlePay() {
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    navigate("/member/payment-success");
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: "#E8E8E8",
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center px-4 pt-5 pb-4 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm cursor-pointer"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-gray-900">
          Payment Summary
        </h1>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-2">
        {/* ── Card 1: Community + card + auto-pay ── */}
        <div className="bg-[#EFEFF1E5] rounded-2xl px-4 py-4">
          {/* Community row */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div
              className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100"
              style={{ background: "#f0f4ff" }}
            >
              {community.logo ? (
                <img
                  src={community.logo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-[#1C2B8A]">KC</span>
              )}
            </div>
            <span className="text-[14px] font-medium text-gray-900">
              {community.name}
            </span>
          </div>
          <div className="bg-[#FFFFFF66] rounded-xl px-4 py-3">
            {/* Card row */}
            <div className="flex items-center justify-between py-3.5 border-b border-gray-300 -mx-4 px-4 mb-2">
              <div className="flex items-center gap-2.5">
                <MastercardIcon />
                <span className="text-[14px] font-medium text-gray-900">
                  ***{card.last4} | {card.expiry}
                </span>
              </div>
              <button
                className="text-[13px] font-semibold cursor-pointer"
                style={{ color: "#1C2B8A" }}
              >
                Change
              </button>
            </div>

            {/* Auto-pay row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-gray-600">
                  Automatic Payment
                </span>
                <Info size={13} className="text-gray-400" />
              </div>
              
              <Toggle on={autoPay} onChange={setAutoPay} />
            </div>
          </div>
        </div>

        {/* ── Card 2: Plan details ── */}
        <div className="bg-[#EFEFF1E5] rounded-2xl px-4 py-4">
          <p className="text-[14px] font-normal text-gray-900 mb-4">
            Plan Details
          </p>

          {/* Schedule */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-gray-500">Payment Schedule:</span>
            <span
              className="text-[12px] font-semibold px-3 py-0.5 rounded-full"
              style={{ background: "#EEF1FB", color: "#1C2B8A" }}
            >
              {plan.schedule}
            </span>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] text-gray-500">Amount:</span>
            <span className="text-[14px] text-gray-900">
              {fmt(plan.amount)}
            </span>
          </div>

          {/* Charge */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <span className="text-[13px] text-gray-500">Charge:</span>
            <span className="text-[14px] text-gray-900">
              {fmt(plan.charge)}
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-500">Total:</span>
            <span className="text-[15px] font-bold text-gray-900">
              {fmt(plan.total)}
            </span>
          </div>
        </div>

        {/* ── Make Payment button ── */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full rounded-md py-4 text-[15px] font-semibold text-white mt-1 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-80"
          style={{ background: "#002FA7" }}
        >
          {loading ? "Processing..." : "Make Payment"}
        </button>
      </div>
    </div>
  );
}
