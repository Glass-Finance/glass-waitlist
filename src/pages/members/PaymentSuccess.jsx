import { useNavigate } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();

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
      <div className="flex items-center px-4 pt-10 pb-4 relative">
        <button
          onClick={() => navigate("/member/home")}
          className="w-9 h-9 rounded-full bg-[#D4D4D4] flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-medium text-gray-800">
          Payment Summary
        </h1>
      </div>

      {/* ── Success content — centred vertically ── */}
      <div className="flex-1 flex flex-col items-center mt-10 gap-4">
        {/* Black circle with checkmark */}
        <div
          className="w-[100px] h-[100px] rounded-full flex items-center justify-center"
          style={{ background: "#111111" }}
        >
          <Check size={44} color="white" strokeWidth={2.5} />
        </div>

        <p className="text-[15px] font-medium text-gray-800 mt-1">
          Payment Successful
        </p>
      </div>
    </div>
  );
}
