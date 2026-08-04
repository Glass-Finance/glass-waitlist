// Search + notification + user row across the top of the dashboard mockup.
export default function TopBar() {
  return (
    <div className="bg-white border-b border-[#eef0f8] py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 bg-[#f5f6fa] rounded-[7px] py-1.5 px-3 border border-[#eef0f8] flex-1 max-w-[340px]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="1.8" />
          <path d="M21 21l-4.35-4.35" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="text-[11px] text-[#9ca3af]">
          Search members, payments, receipts...
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke="#6b7280"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div className="absolute top-0 right-0 w-[5px] h-[5px] bg-[#e11d48] rounded-full border border-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[26px] h-[26px] rounded-full bg-[linear-gradient(135deg,#002FA7,#4f6fe5)] flex items-center justify-center text-white text-[9px] font-bold">
            AA
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#0f1d6e] leading-[1.2]">
              Amina Agrawal
            </div>
            <div className="text-[9px] text-[#9ca3af]">amina@gmail.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
