// Reveal-in/out ids (dbo-e5/e6/e7, dbo-pb0/pb1/pb2) are driven imperatively
// by DashboardOverlay's animation loop — see constants.js's ELEM_IDS/PBARS.
const REVEAL_STYLE = {
  opacity: 0,
  transform: "translateY(10px)",
  transition: "opacity .5s ease, transform .5s ease",
};

const PLANS = [
  {
    id: "e5",
    pb: "pb0",
    name: "Association Dues",
    freq: "Monthly",
    fColor: "#d4a017",
    fBg: "#fff8e7",
    amt: "₦1.2M",
    paid: "24 / 120",
    bar: "#d4a017",
    pct: "60%",
  },
  {
    id: "e6",
    pb: "pb1",
    name: "Infrastructure Development",
    freq: "One-Time",
    fColor: "#7c3aed",
    fBg: "#f3eeff",
    amt: "₦300,000",
    paid: "24 / 120",
    bar: "#7c3aed",
    pct: "74%",
  },
  {
    id: "e7",
    pb: "pb2",
    name: "End Of The Year Party",
    freq: "Weekly",
    fColor: "#059669",
    fBg: "#ecfdf5",
    amt: "₦400,500",
    paid: "24 / 120",
    bar: "#059669",
    pct: "20%",
  },
];

export default function PaymentPlansPanel() {
  return (
    <div className="bg-[rgba(204,219,255,0.4)] rounded-[10px] border border-[#eef0f8] p-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-[#0f1d6e]">Payment Plans</span>
        <span className="text-[11px] text-brand font-semibold">Manage All</span>
      </div>
      {PLANS.map((p) => (
        <div
          key={p.id}
          id={"dbo-" + p.id}
          className="bg-white rounded-lg py-2.5 px-3 mb-1.5 border border-[rgba(204,219,255,0.6)]"
          style={REVEAL_STYLE}
        >
          <div className="flex items-center justify-between mb-[3px]">
            <div className="flex items-center gap-[5px]">
              <span className="text-[11px] font-bold text-[#0f1d6e]">{p.name}</span>
              <span
                style={{ color: p.fColor, background: p.fBg }}
                className="text-[9px] font-bold rounded-full py-px px-1.5"
              >
                {p.freq}
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-[#0f1d6e]">{p.amt}</span>
          </div>
          <div className="text-[9px] text-[#9ca3af] mb-[5px]">{p.paid} members paid</div>
          <div className="h-1 rounded-full bg-[#eef0f8] overflow-hidden">
            <div
              id={"dbo-" + p.pb}
              className="h-full rounded-full"
              style={{ background: p.bar, width: 0 }}
            />
          </div>
          <div className="text-[9px] text-[#9ca3af] text-right mt-0.5">{p.pct} Collected</div>
        </div>
      ))}
    </div>
  );
}
