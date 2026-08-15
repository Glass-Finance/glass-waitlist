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
        paddingTop: 18,
        paddingBottom: 16,
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
      {/* Home / communities-overview -- a bare icon, no background box, per
          the real rail's treatment. */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
      {/* Community tiles -- always solid white (logo or initials), never
          translucent. Active community: a pill riding the rail's outer edge
          marks it, not a filled/differently-shaded tile. */}
      <div style={{ position: "relative", marginBottom: 8 }}>
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
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "#fff",
            color: "#002FA7",
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
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "#fff",
          color: "#002FA7",
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
