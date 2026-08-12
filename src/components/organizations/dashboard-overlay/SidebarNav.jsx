// White nav column of the animated dashboard mockup. `nav` is the guided
// tour's current screen ("dashboard" | "payments" | "members") — drives
// which item renders as active, mirroring the real app's sidebar.
export default function SidebarNav({ nav }) {
  const items = [
    {
      label: "Dashboard",
      active: nav === "dashboard",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      label: "Payments",
      active: nav === "payments",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2 10h20M6 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Members",
      active: nav === "members",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Notifications",
      active: false,
      badge: 3,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Settings",
      active: false,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        width: 180,
        background: "#fff",
        borderRight: "1px solid #E0E0EB",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "11px 12px",
          borderBottom: "1px solid #E0E0EB",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#000", lineHeight: 1.3 }}>
          Kings College Alumni
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#e85d04",
            background: "#fff4ee",
            borderRadius: 99,
            padding: "1px 6px",
            display: "inline-block",
            marginTop: 2,
          }}
        >
          Admin
        </span>
      </div>
      <div style={{ padding: "8px", flex: 1 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6.5px 10px",
              borderRadius: 8,
              marginBottom: 2,
              background: item.active ? "#e6eeff" : "transparent",
              color: item.active ? "#002FA7" : "#6b7280",
              fontSize: 12,
              fontWeight: item.active ? 700 : 500,
              position: "relative",
            }}
          >
            {item.icon}
            {item.label}
            {item.badge != null && (
              <span
                style={{
                  marginLeft: "auto",
                  minWidth: 14,
                  height: 14,
                  padding: "0 3px",
                  borderRadius: 99,
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "6px 8px", borderTop: "1px solid #E0E0EB" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6.5px 10px",
            borderRadius: 8,
            color: "#6b7280",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Member View
        </div>
      </div>
    </div>
  );
}
