import SuccessBadge from "../../../components/common/SuccessBadge";
import { Button } from "../../../components/ui/Button";

// No suitable shared modal exists — PaymentProfile.jsx's SuccessModal is a
// different design (different message, no props, different styling), so this
// is a straight move of AddMembers' own modal, unchanged.
export default function SuccessModal({ communityName, onDashboard, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/20">
      <div className="bg-surface-bg rounded-t-[24px] lg:rounded-3xl flex flex-col items-center text-center px-8 py-12 lg:px-10 lg:py-20 w-full lg:max-w-[550px] shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
        <SuccessBadge
          message="Your Community Is Now Live"
          subMessage={`${communityName ?? "Your community"} is all set up on Glass!`}
          className="mb-8"
        />
        <Button onClick={onDashboard} size="sm" className="lg:w-4/5 mb-5">
          Go To Dashboard
        </Button>
        <p className="text-xs text-gray-900 mb-1">Ready To Invite Members?</p>
        <button
          onClick={onCopy}
          className="text-xs font-medium text-brand hover:underline bg-transparent border-none cursor-pointer"
        >
          Click here to copy your community link
        </button>
        <div className="h-[env(safe-area-inset-bottom,0px)] lg:hidden" />
      </div>
    </div>
  );
}
