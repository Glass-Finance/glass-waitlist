import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, Users, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const NAV = [
  { icon: <LayoutDashboard size={17}/>, label: "Dashboard", id: "dashboard", path: "/dashboard"          },
  { icon: <CreditCard size={17}/>,      label: "Payments",  id: "payments",  path: "/dashboard/payments" },
  { icon: <Users size={17}/>,           label: "Members",   id: "members",   path: "/dashboard/members"  },
  { icon: <Settings size={17}/>,        label: "Settings",  id: "settings",  path: "/dashboard/settings" },
];

const COMMUNITIES = [
  { tag: "KC", name: "Kings College Alumni" },
  { tag: "C1", name: "Community 1"          },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeCom, setActiveCom] = useState("KC");

  const active    = NAV.find(n => location.pathname === n.path)?.id || "dashboard";
  const community = COMMUNITIES.find(c => c.tag === activeCom);
  const W         = collapsed ? 0 : 200;

  return (
    <div style={{ display: "flex", height: "100vh", position: "sticky", top: 0, zIndex: 60, flexShrink: 0 }}>

      {/* ── Blue rail ── */}
      <div style={{
        width: 56, flexShrink: 0,
        background: "#002FA7",
        display: "flex", flexDirection: "column",
        alignItems: "center",
        paddingTop: 14, paddingBottom: 20,
        fontFamily: "Inter, sans-serif",
      }}>
        {/* Glass logo → landing page */}
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}
          title="Go to landing page"
        >
          <img
            src="/Glass.png" alt="Glass"
            style={{ width: 26, height: 26, objectFit: "contain", filter: "brightness(0) invert(1)", display: "block" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          {/* Fallback if logo missing */}
          <div style={{
            display: "none", width: 26, height: 26, borderRadius: 6,
            background: "rgba(255,255,255,0.25)",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: 13,
          }}>G</div>
        </button>

        {/* Home — communities picker */}
        <button
          onClick={() => navigate("/dashboard/home")}
          title="Your Communities"
          style={{
            width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
            background: location.pathname === "/dashboard/home" ? "#fff" : "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: location.pathname === "/dashboard/home" ? "#002FA7" : "#fff",
            marginBottom: 12, transition: "all .15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Divider */}
        <div style={{ width: 22, height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 14 }}/>

        {/* Community avatars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {COMMUNITIES.map(c => (
            <button
              key={c.tag}
              onClick={() => { setActiveCom(c.tag); navigate("/dashboard"); }}
              title={c.name}
              style={{
                width: 34, height: 34, borderRadius: 9, border: "none", cursor: "pointer",
                background: activeCom === c.tag ? "#fff" : "rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: activeCom === c.tag ? "#002FA7" : "#fff",
                fontWeight: 800, fontSize: 11,
                transition: "all .15s",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {c.tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── White nav panel ── */}
      <div style={{
        width: W,
        background: "#fff",
        borderRight: "1px solid #eef0f8",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transition: "width .22s cubic-bezier(0.4,0,0.2,1)",
        fontFamily: "Inter, sans-serif",
      }}>

        {/* Org header — collapse button sits here beside the org name */}
        <div style={{
          padding: "15px 12px 13px",
          borderBottom: "1px solid #eef0f8",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          gap: 8, minHeight: 64,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#0f1d6e",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}>
              {community?.name}
            </div>
            <span style={{
              display: "inline-block", marginTop: 3,
              fontSize: 10, fontWeight: 700, color: "#e85d04",
              background: "#fff4ee", borderRadius: 99, padding: "1px 8px",
            }}>
              Admin
            </span>
          </div>

          {/* Collapse toggle — sits beside org name */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", flexShrink: 0, padding: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, transition: "background .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {collapsed
              ? <PanelLeftOpen  size={16}/>
              : <PanelLeftClose size={16}/>
            }
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {NAV.map(({ icon, label, id, path }) => {
            const isActive = id === active;
            return (
              <button
                key={id}
                onClick={() => navigate(path)}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 10px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  background: isActive ? "#e6eeff" : "transparent",
                  color: isActive ? "#002FA7" : "#6b7280",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  marginBottom: 2,
                  transition: "all .15s",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Collapsed: floating expand button on the edge ── */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          style={{
            position: "absolute", left: 56, top: 18,
            width: 20, height: 20, borderRadius: "0 6px 6px 0",
            background: "#fff", border: "1px solid #eef0f8",
            borderLeft: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", zIndex: 61,
          }}
        >
          <PanelLeftOpen size={12}/>
        </button>
      )}
    </div>
  );
}