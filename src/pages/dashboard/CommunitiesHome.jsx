import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Grid, List, ChevronDown, Users, Clock } from "lucide-react";

const FONT = { fontFamily: "Inter, sans-serif" };

// ─── Mock data ────────────────────────────────────────────────────────────────
const COMMUNITIES = [
  { tag: "KC", name: "Kings College Alumni", members: 24, role: "Admin",  totalPayments: "₦240,000", overdueMembers: 6,  nextPayment: null,          status: null   },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
  { tag: "KC", name: "Kings College Alumni", members: 24, role: "Admin",  totalPayments: "₦240,000", overdueMembers: 6,  nextPayment: null,          status: null   },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
];

const SORT_OPTIONS = ["Recently Viewed", "A-Z", "Z-A", "Newest First"];

// ─── Blue rail only (no white nav panel on this page) ────────────────────────
function BlueRail({ activeCom, setActiveCom }) {
  const navigate = useNavigate();

  return (
    <div style={{
      width: 56, flexShrink: 0,
      background: "#002FA7",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      paddingTop: 14, paddingBottom: 20,
      height: "100vh", position: "sticky", top: 0,
      zIndex: 60,
    }}>
      {/* Glass logo */}
      <div style={{ marginBottom: 20 }}>
        <img
          src="/Glass.png" alt="Glass"
          style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(0) invert(1)" }}
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>

      {/* Home — active on this page */}
      <button
        style={{
          width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
          background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21V12h6v9" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: 22, height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 14 }}/>

      {/* Community avatars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {[{ tag: "C2" }, { tag: "C1" }].map(c => (
          <button
            key={c.tag}
            onClick={() => { setActiveCom(c.tag); navigate("/dashboard"); }}
            title={c.tag}
            style={{
              width: 34, height: 34, borderRadius: 9, border: "none", cursor: "pointer",
              background: activeCom === c.tag ? "#fff" : "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: activeCom === c.tag ? "#002FA7" : "#fff",
              fontWeight: 800, fontSize: 11,
              transition: "all .15s", ...FONT,
            }}
          >
            {c.tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar() {
  return (
    <header style={{
      height: 56, background: "#fff",
      borderBottom: "1px solid #eef0f8",
      display: "flex", alignItems: "center",
      gap: 16, padding: "0 24px",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{
        flex: 1, maxWidth: 440,
        display: "flex", alignItems: "center", gap: 8,
        background: "#f5f6fa", borderRadius: 8,
        padding: "8px 12px", border: "1px solid #eef0f8",
      }}>
        <Search size={13} color="#9ca3af"/>
        <input
          placeholder="Search Communities"
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#374151", ...FONT }}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
          <Bell size={17}/>
          <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: "50%", background: "#e11d48", border: "2px solid #fff" }}/>
        </button>
        <div style={{ width: 1, height: 26, background: "#eef0f8" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#002FA7,#4f6fe5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 12, ...FONT,
          }}>AA</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f1d6e", lineHeight: 1.2, ...FONT }}>Amina Agrawal</div>
            <div style={{ fontSize: 11, color: "#9ca3af", ...FONT }}>amina@gmail.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Community card ───────────────────────────────────────────────────────────
function CommunityCard({ c, onClick }) {
  const isAdmin = c.role === "Admin";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 14,
        border: "1px solid #eef0f8",
        boxShadow: "0 1px 4px rgba(0,47,167,0.05)",
        overflow: "hidden", cursor: "pointer",
        transition: "transform .15s, box-shadow .15s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,47,167,0.10)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,47,167,0.05)";
      }}
    >
      {/* Card top */}
      <div style={{ padding: "20px 20px 14px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Org avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: isAdmin
                ? "linear-gradient(135deg,#002FA7,#4f6fe5)"
                : "linear-gradient(135deg,#6b7280,#9ca3af)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 14, ...FONT,
            }}>
              {c.tag}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1d6e", lineHeight: 1.3, ...FONT }}>{c.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                <Users size={11} color="#9ca3af"/>
                <span style={{ fontSize: 12, color: "#9ca3af", ...FONT }}>{c.members} Members</span>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: isAdmin ? "#002FA7" : "#374151",
            border: `1px solid ${isAdmin ? "#c7d2fe" : "#e5e7eb"}`,
            background: isAdmin ? "#f0f4ff" : "#f9fafb",
            borderRadius: 6, padding: "3px 10px",
            flexShrink: 0, ...FONT,
          }}>
            {c.role}
          </span>
        </div>

        {/* Illustration area — placeholder gradient matching figma grey block */}
        <div style={{
          width: "100%", height: 120, borderRadius: 10,
          background: "linear-gradient(135deg,#f0f2f8 0%,#e4e8f4 100%)",
          marginBottom: 4,
        }}/>
      </div>

      {/* Card footer */}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid #f3f4f8",
        background: "#fafbff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {isAdmin ? (
          <>
            <span style={{ fontSize: 12, color: "#374151", ...FONT }}>
              Total Payments: <strong style={{ color: "#0f1d6e" }}>{c.totalPayments}</strong>
            </span>
            <span style={{ fontSize: 12, color: "#374151", ...FONT }}>
              Overdue Members: <strong style={{ color: "#e11d48" }}>{c.overdueMembers}</strong>
            </span>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={12} color="#9ca3af"/>
              <span style={{ fontSize: 12, color: "#374151", ...FONT }}>
                Next Payment: <strong style={{ color: "#0f1d6e" }}>{c.nextPayment}</strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#6b7280", ...FONT }}>Status:</span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: "#374151",
                background: "#e5e7eb", borderRadius: 5,
                padding: "2px 10px", ...FONT,
              }}>
                {c.status}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CommunitiesHome ──────────────────────────────────────────────────────────
export default function CommunitiesHome() {
  const navigate   = useNavigate();
  const [activeCom, setActiveCom] = useState("C2");
  const [view,      setView]      = useState("grid");   // "grid" | "list"
  const [sort,      setSort]      = useState("Recently Viewed");
  const [sortOpen,  setSortOpen]  = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FC", ...FONT }}>
      <BlueRail activeCom={activeCom} setActiveCom={setActiveCom}/>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar/>

        <main style={{ flex: 1, padding: "28px 28px 48px", overflowY: "auto" }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f1d6e", margin: 0, ...FONT }}>
              Your Communities
            </h1>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate("/dashboard/create-community")}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "none",
                  background: "#002FA7", color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", ...FONT,
                }}
              >
                Create Community
              </button>
              <button
                onClick={() => navigate("/dashboard/join-community")}
                style={{
                  padding: "9px 18px", borderRadius: 8,
                  border: "1.5px solid #002FA7", background: "#fff",
                  color: "#002FA7", fontSize: 13, fontWeight: 600, cursor: "pointer", ...FONT,
                }}
              >
                Join Community
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {/* Sort dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  border: "1px solid #e0e3f0", background: "#fff",
                  fontSize: 13, fontWeight: 500, color: "#374151",
                  cursor: "pointer", ...FONT,
                }}
              >
                {sort} <ChevronDown size={13}/>
              </button>
              {sortOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0,
                  background: "#fff", borderRadius: 10, border: "1px solid #eef0f8",
                  boxShadow: "0 8px 24px rgba(0,47,167,0.10)",
                  zIndex: 100, minWidth: 160, overflow: "hidden",
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSort(opt); setSortOpen(false); }}
                      style={{
                        width: "100%", padding: "9px 14px", border: "none",
                        background: sort === opt ? "#f0f4ff" : "#fff",
                        color: sort === opt ? "#002FA7" : "#374151",
                        fontSize: 13, fontWeight: sort === opt ? 600 : 400,
                        cursor: "pointer", textAlign: "left", ...FONT,
                      }}
                      onMouseEnter={e => { if (sort !== opt) e.currentTarget.style.background = "#f9fafb"; }}
                      onMouseLeave={e => { if (sort !== opt) e.currentTarget.style.background = "#fff"; }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
              {[
                { id: "grid", icon: <Grid size={15}/> },
                { id: "list", icon: <List size={15}/> },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 7, border: "1px solid #e0e3f0",
                    background: view === v.id ? "#e6eeff" : "#fff",
                    color: view === v.id ? "#002FA7" : "#6b7280",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .15s",
                  }}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Community grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: view === "grid" ? "repeat(3, 1fr)" : "1fr",
            gap: 16,
          }}>
            {COMMUNITIES.map((c, i) => (
              <CommunityCard
                key={i}
                c={c}
                onClick={() => {
                  setActiveCom(c.tag);
                  navigate("/dashboard");
                }}
              />
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}