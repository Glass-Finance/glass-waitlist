// Reveal-in/out ids (dbo-e5/e6/e7, dbo-pb0/pb1/pb2) are driven imperatively
// by DashboardOverlay's animation loop — see constants.js's ELEM_IDS/PBARS.
const REVEAL_STYLE = {
  opacity: 0,
  transform: "translateY(10px)",
  transition: "opacity .5s ease, transform .5s ease",
};

// Frequency pill is always purple in the real app (PaymentPlansCard.jsx) --
// it doesn't vary by frequency. Progress-bar color does vary, cycling
// through the real app's BAR_COLOR_CLASSES palette by position, not by
// frequency either.
const BAR_COLORS = ["#d4a017", "#7c3aed", "#002FA7"];

const PLANS = [
  {
    id: "e6",
    pb: "pb0",
    name: "Association Dues",
    freq: "Monthly",
    amt: "₦1.2M",
    paid: "24 / 120",
    pct: "60%",
  },
  {
    id: "e7",
    pb: "pb1",
    name: "Infrastructure Development",
    freq: "One-Time",
    amt: "₦300,000",
    paid: "24 / 120",
    pct: "74%",
  },
];

export default function PaymentPlansPanel() {
  return (
    <div
      style={{
        background: "#D7E2FF",
        borderRadius: 12,
        border: "1px solid #E0E0EB",
        padding: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>Payment Plans</span>
        <span style={{ fontSize: 11, color: "#002FA7", fontWeight: 600 }}>Manage All</span>
      </div>
      {PLANS.map((p, i) => (
        <div
          key={p.id}
          id={"dbo-" + p.id}
          style={{
            ...REVEAL_STYLE,
            background: "#fff",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 5,
            border: "1px solid rgba(204,219,255,0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#000" }}>{p.name}</span>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: "#7c3aed",
                  background: "#f3eeff",
                  borderRadius: 99,
                  padding: "1px 6px",
                }}
              >
                {p.freq}
              </span>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#000" }}>{p.amt}</span>
          </div>
          <div style={{ fontSize: 8.5, color: "#9ca3af", marginBottom: 5 }}>{p.paid} members paid</div>
          <div style={{ height: 4, borderRadius: 99, background: "#E0E0EB", overflow: "hidden" }}>
            <div
              id={"dbo-" + p.pb}
              style={{ height: "100%", borderRadius: 99, background: BAR_COLORS[i % BAR_COLORS.length], width: 0 }}
            />
          </div>
          <div style={{ fontSize: 8.5, color: "#9ca3af", textAlign: "right", marginTop: 3 }}>
            {p.pct} Collected
          </div>
        </div>
      ))}
    </div>
  );
}
