// Reveal-in/out ids (dbo-e8..dbo-e11) are driven imperatively by
// DashboardOverlay's animation loop — see constants.js's ELEM_IDS.
const REVEAL_STYLE = {
  opacity: 0,
  transform: "translateY(10px)",
  transition: "opacity .5s ease, transform .5s ease",
};

const ACTIVITY = [
  {
    id: "e8",
    aBg: "#ecfdf5",
    aColor: "#059669",
    type: "payment",
    name: "Joseph Alabi",
    action: "paid",
    detail: "₦20,200 for Infrastructure...",
  },
  {
    id: "e9",
    aBg: "#e6eeff",
    aColor: "#002FA7",
    type: "member",
    name: "Grace Adekunle",
    action: "joined the community",
    detail: "",
  },
  {
    id: "e10",
    aBg: "#ecfdf5",
    aColor: "#059669",
    type: "payment",
    name: "Emeka Nwosu",
    action: "paid Event Fee",
    detail: "₦15,000",
  },
  {
    id: "e11",
    aBg: "#fff8e7",
    aColor: "#d4a017",
    type: "reminder",
    name: null,
    action: "Dues Reminder Sent to",
    detail: "12 members",
  },
];

function ActivityIcon({ type, color }) {
  if (type === "payment") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
        <path
          d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "member") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      </svg>
    );
  }
  if (type === "reminder") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

export default function RecentActivityPanel() {
  return (
    <div className="bg-white rounded-[10px] border border-[#eef0f8] p-3">
      <div className="text-xs font-bold text-[#0f1d6e] mb-2.5">Recent Activity</div>
      {ACTIVITY.map((a, i, arr) => (
        <div
          key={a.id}
          id={"dbo-" + a.id}
          className={`flex items-start gap-[9px] py-2.5 ${i < arr.length - 1 ? "border-b border-[#f3f4f8]" : "border-b-0"}`}
          style={REVEAL_STYLE}
        >
          <div
            style={{ background: a.aBg }}
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
          >
            <ActivityIcon type={a.type} color={a.aColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#374151] m-0 leading-[1.45]">
              {a.name && <strong className="text-brand font-bold">{a.name} </strong>}
              {a.action}
              {a.detail && (
                <>
                  {" "}
                  <strong className="text-[#0f1d6e]">{a.detail}</strong>
                </>
              )}
            </p>
            <div className="flex items-center gap-[3px] mt-[3px]">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.8" />
                <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="text-[9px] text-[#9ca3af]">5 hours ago</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
