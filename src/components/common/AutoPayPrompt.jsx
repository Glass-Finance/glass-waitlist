import { formatNaira } from "../../utils/format";
import { frequencyAdverb } from "../../utils/recurring";
import { Button } from "../ui/Button";

// Auto-Pay prompt — shown once on returning to Home (member) or the
// dashboard (admin paying their own dues) right after paying a recurring
// plan without saving a payment method (or any time auto-pay isn't already
// on for it). The caller decides *whether* to offer this (it already knows
// the plan/consent state) and *where* "Yes" should send the payer, since
// there's no API to just flip auto-pay on -- the backend only ever
// establishes it via a real payment with a fresh authorisation -- so this
// only renders the ask; "Yes" sends them into the real Auto-Pay settings
// flow rather than pretending a tap enabled it instantly.
export default function AutoPayPrompt({ prompt, onDismiss, onEnable }) {
  return (
    <div
      className="bg-black/20 fixed inset-0 z-[80] flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="w-full max-w-[430px] bg-white rounded-[20px] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <h2 className="text-[19px] font-bold text-[#111] mb-2.5">
          Turn on Auto-Pay
        </h2>
        <p className="text-sm text-[#555] leading-[1.55] mb-6">
          Would you like us to charge {formatNaira(prompt.amount)} automatically for{" "}
          <strong className="text-[#111]">{prompt.planName}</strong> {frequencyAdverb(prompt.frequency)}?
        </p>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onDismiss}
            className="py-[11px] px-[22px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[#374151] text-sm font-semibold cursor-pointer"
          >
            No
          </button>
          <Button onClick={onEnable} fullWidth={false} className="px-[26px]">
            Yes
          </Button>
        </div>
      </div>
    </div>
  );
}
