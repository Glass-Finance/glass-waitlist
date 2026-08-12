import { Check, ChevronRight, Users } from "lucide-react";
import inviteIllustration from "../../../../assets/dashboard/empty-states/invite-illustration.png";
import { Button } from "../../../../components/ui/Button";

// The very first thing an admin sees on a brand-new community — before a
// single member or payment plan exists. Replaces the whole dashboard body
// (header, stats, tables) rather than sitting alongside empty stats, since
// there's nothing yet worth showing next to it. Once either a member or a
// plan exists, DashboardContent falls back to the normal stats/tables view
// plus the smaller, dismissible GettingStartedChecklist banner for whatever
// setup steps (payout account, etc.) remain.
export default function WelcomeEmptyState({ onCreatePlan, onAddMember }) {
  return (
    <div className="flex flex-col items-center py-16 px-6">
      <img
        src={inviteIllustration}
        alt=""
        className="w-[280px] h-auto mb-6"
        draggable={false}
      />
      <h1 className="text-xl leading-7 font-normal text-gray-900 text-center mb-1.5">
        Welcome to <span style={{ color: "#6366F1" }}>Glass!</span>
      </h1>
      <p className="text-base text-gray-400 text-center mb-7 max-w-sm">
        Let's get your community ready to start collecting.
      </p>
      <Button
        onClick={onCreatePlan}
        fullWidth={false}
        className="px-6 mb-8"
      >
        Create Your First Collection
      </Button>

      <div className="w-full max-w-lg flex flex-col gap-2.5">
        <div className="w-full bg-white rounded-xl border border-surface-container-border px-5 py-4 flex items-center gap-4 text-left">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <Check size={16} className="text-emerald-600" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-400">Community Created</p>
            <p className="text-xs text-gray-400 mt-0.5">Your community is live and ready</p>
          </div>
        </div>

        <button
          onClick={onAddMember}
          className="w-full bg-white rounded-xl border border-surface-container-border px-5 py-4 flex items-center gap-4 text-left cursor-pointer transition-colors hover:bg-blue-50/30"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-brand">
            <Users size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Add Your First Members</p>
            <p className="text-xs text-gray-400 mt-0.5">Invite Via Link, CSV Upload, or Manually</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
