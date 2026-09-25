import { useNavigate } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";

// Bottom sheet shown before community create/manage when KYC is not APPROVED.
// Non-danger brand styling (unlike ConfirmSheet's destructive default).
// verifyPath lets the desktop dashboard send people to its own verify page —
// the member-app path is behind the mobile-only device gate.
export default function KycRequiredSheet({ open, onClose, reason, verifyPath }) {
  const navigate = useNavigate();
  if (!open) return null;

  function goVerify() {
    onClose?.();
    navigate(verifyPath ?? "/member/verify-identity");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(15,23,42,0.45)] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-white rounded-t-[20px] sm:rounded-[20px] pt-6 px-5 pb-7"
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-1 text-[#9CA3AF]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-1 bg-brand-tint">
            <ShieldCheck size={24} className="text-brand" />
          </div>
          <p className="text-[17px] font-bold text-[#111] m-0">Verify your identity</p>
          <p className="text-[13.5px] text-[#6B7280] m-0 leading-[1.55] max-w-[320px]">
            {reason ??
              "Identity verification is required to create or manage communities. It only takes a few minutes."}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            onClick={goVerify}
            className="w-full py-3.5 px-0 rounded-xl border-none text-white text-[14.5px] font-semibold bg-brand cursor-pointer opacity-100"
          >
            Verify identity
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 px-0 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-[14.5px] font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
