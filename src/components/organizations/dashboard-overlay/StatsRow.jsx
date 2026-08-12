// Reveal-in/out ids (dbo-e1..dbo-e4) are driven imperatively by
// DashboardOverlay's animation loop — see constants.js's ELEM_IDS.
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
          stroke="#b45309"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="4" stroke="#b45309" strokeWidth="1.8" />
        <line x1="17" y1="11" x2="23" y2="17" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="23" y1="11" x2="17" y2="17" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "e3",
    label: "Overdue Members",
    value: "07",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="1.8" />
        <path d="M12 7v6" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="#DC2626" />
      </svg>
    ),
  },
  {
    id: "e4",
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
    id: "e5",
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 12 }}>
      {STATS.map((s) => (
        <div
          key={s.id}
          id={"dbo-" + s.id}
          style={{
            ...REVEAL_STYLE,
            background: "#fff",
            borderRadius: 8,
            padding: "12px",
            border: "1px solid #E0E0EB",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              color: "#6b7280",
              fontWeight: 500,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {s.label}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#c4c9e0" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="#c4c9e0" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {s.icon}
            <span style={{ fontSize: s.small ? 11 : 15, fontWeight: 700, color: "#000" }}>
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
