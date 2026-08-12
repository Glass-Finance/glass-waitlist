// Reveal-in/out ids (dbo-e8..dbo-e11) are driven imperatively by
// DashboardOverlay's animation loop — see constants.js's ELEM_IDS.
const REVEAL_STYLE = {
  opacity: 0,
  transform: "translateY(10px)",
  transition: "opacity .5s ease, transform .5s ease",
};

// "payment" (green) / "member" (brand) / "failed" (red) are the real
// RecentActivityCard.jsx's actual category set -- there's no distinct
// "reminder" category in the real app, so that invented type is replaced
// with a real "failed" example instead.
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
    aBg: "#fff1f2",
    aColor: "#e11d48",
    type: "failed",
    name: "Chidinma Obi",
    action: "payment failed for",
    detail: "Association Dues",
  },
];

function ActivityIcon({ type, color }) {
  if (type === "payment" || type === "failed") {
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
  return null;
}

export default function RecentActivityPanel() {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E0E0EB", padding: "10px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 8 }}>
        Recent Activity
      </div>
      {ACTIVITY.map((a, i, arr) => (
        <div
          key={a.id}
          id={"dbo-" + a.id}
          style={{
            ...REVEAL_STYLE,
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            padding: "7px 0",
            borderBottom: i < arr.length - 1 ? "1px solid #f3f4f8" : "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              flexShrink: 0,
              background: a.aBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIcon type={a.type} color={a.aColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10.5, color: "#374151", margin: 0, lineHeight: 1.5 }}>
              {a.name && (
                <strong style={{ color: "#002FA7", fontWeight: 700 }}>{a.name} </strong>
              )}
              {a.action}
              {a.detail && (
                <>
                  {" "}
                  <strong style={{ color: "#000" }}>{a.detail}</strong>
                </>
              )}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.8" />
                <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 9, color: "#9ca3af" }}>5 hours ago</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
