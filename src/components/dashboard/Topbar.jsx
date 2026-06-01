import { Search, Bell } from "lucide-react";

export default function Topbar({ searchPlaceholder = "Search members, payments, receipts..." }) {
  return (
    <header style={{
      height: 56, background: "#fff", borderBottom: "1px solid #eef0f8",
      display: "flex", alignItems: "center", gap: 16, padding: "0 24px",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Search */}
      <div style={{
        flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 8,
        background: "#f5f6fa", borderRadius: 8, padding: "8px 12px",
        border: "1px solid #eef0f8",
      }}>
        <Search size={14} color="#9ca3af"/>
        <input
          placeholder={searchPlaceholder}
          style={{
            flex: 1, border: "none", background: "transparent",
            outline: "none", fontSize: 13, color: "#374151",
          }}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Bell */}
        <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
          <Bell size={18}/>
          <span style={{
            position: "absolute", top: -2, right: -2,
            width: 7, height: 7, borderRadius: "50%",
            background: "#e11d48", border: "2px solid #fff",
          }}/>
        </button>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#1C2B8A,#4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 12,
          }}>
            AA
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f1d6e", lineHeight: 1.2 }}>Amina Agrawal</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>amina@gmail.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}

