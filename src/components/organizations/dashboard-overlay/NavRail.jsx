// Blue icon rail on the far left of the animated dashboard mockup.
export default function NavRail() {
  return (
    <div
      style={{
        width: 56,
        background: "#002FA7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <img
          src="/Glass.webp"
          alt=""
          style={{
            width: 24,
            height: 24,
            objectFit: "contain",
            filter: "brightness(0) invert(1)",
          }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      {/* Home / communities-overview -- translucent (inactive) here since a
          specific community's Dashboard is the active view, matching the
          real rail's inactive-state treatment. */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V12h6v9"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          width: 20,
          height: 1,
          background: "rgba(255,255,255,0.2)",
          marginBottom: 12,
        }}
      />
      {/* Active community: a pill riding the rail's outer edge marks it,
          not a filled/differently-shaded tile -- matches the real Sidebar's
          indicator treatment. */}
      <div style={{ position: "relative", marginBottom: 7 }}>
        <div
          style={{
            position: "absolute",
            left: -10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 6,
            height: 24,
            borderRadius: 99,
            background: "#fff",
          }}
        />
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "rgba(255,255,255,0.18)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          KC
        </div>
      </div>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "rgba(255,255,255,0.18)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        C1
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 17l5-5-5-5M21 12H9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
