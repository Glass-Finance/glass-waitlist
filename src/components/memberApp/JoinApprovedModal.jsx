// Shared by DiscoverCommunities.jsx and Home.jsx — both watch
// useJoinApprovalWatcher() and need the same "you're in" popup wherever the
// approval happens to land.
export default function JoinApprovedModal({ entry, onOpen, onDismiss }) {
  if (!entry) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onDismiss(entry)}
    >
      <div className="border border-surface-container-border w-full max-w-[340px] bg-surface-bg rounded-[20px] py-7 px-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <span className="text-4xl leading-none block mb-3">🎉</span>
        <p className="text-[17px] font-bold text-[#065F46] mb-1.5">
          You're in!
        </p>
        <p className="text-[13.5px] text-[#374151] mb-[22px] leading-relaxed">
          Your request to join <strong>{entry.name}</strong> was approved — you're now a member.
        </p>
        <button
          onClick={() => onOpen(entry)}
          className="w-full py-[13px] rounded-[10px] border-none bg-[#059669] text-white text-sm font-semibold cursor-pointer mb-2.5"
        >
          Open Community
        </button>
        <button
          onClick={() => onDismiss(entry)}
          className="w-full py-2.5 rounded-[10px] border-none bg-transparent text-[#6B7280] text-[13px] font-medium cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
