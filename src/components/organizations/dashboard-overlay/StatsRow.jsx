// Static per-item transition style — DashboardOverlay's reveal-in/out loop
// toggles opacity/transform on these elements imperatively via
// document.getElementById("dbo-" + id), keyed off ELEM_IDS in constants.js.
const REVEAL_STYLE = {
  opacity: 0,
  transform: "translateY(10px)",
  transition: "opacity .5s ease, transform .5s ease",
};

const STATS = [
  {
    id: "e1",
    label: "Total Members",
    value: "209",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          stroke="#002FA7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="4" stroke="#002FA7" strokeWidth="1.8" />
        <path
          d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          stroke="#002FA7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "e2",
    label: "Inactive Members",
    value: "12",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          stroke="#e85d04"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="4" stroke="#e85d04" strokeWidth="1.8" />
        <line x1="17" y1="11" x2="23" y2="17" stroke="#e85d04" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="23" y1="11" x2="17" y2="17" stroke="#e85d04" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "e3",
    label: "Total Contributions",
    value: "₦ 2,002,490",
    small: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#d4a017" strokeWidth="1.8" />
        <path
          d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"
          stroke="#d4a017"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "e4",
    label: "Active Plans",
    value: "05",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#7c3aed" strokeWidth="1.8" />
        <path d="M2 10h20M6 15h4" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function StatsRow() {
  return (
    <div className="grid grid-cols-4 gap-2 mb-3">
      {STATS.map((s) => (
        <div
          key={s.id}
          id={"dbo-" + s.id}
          className="shadow-[0_1px_4px_rgba(0,47,167,0.05)] bg-white rounded-[10px] py-3 px-3.5 border border-[#eef0f8]"
          style={REVEAL_STYLE}
        >
          <div className="text-[10px] text-[#6b7280] font-medium mb-2 flex justify-between items-center">
            {s.label}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#c4c9e0" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="#c4c9e0" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            {s.icon}
            <span className={`font-extrabold text-[#0f1d6e] ${s.small ? "text-xs" : "text-base"}`}>
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
