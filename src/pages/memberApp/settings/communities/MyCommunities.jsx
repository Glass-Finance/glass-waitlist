import { useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut } from "lucide-react";
import { useMyCommunities, useLeaveCommunity } from "../../../../hooks/useMyAccount";

function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export default function MyCommunities() {
  const navigate = useNavigate();
  const { data: raw = [], isLoading } = useMyCommunities();
  const communities = raw.map((c) => ({
    ...c,
    name: c.name ?? c.community?.name,
    slug: c.slug ?? c.community?.slug,
    logo: c.logo ?? c.community?.logo,
  }));
  const leaveCommunity = useLeaveCommunity();

  function handleLeave(community) {
    if (!window.confirm(`Leave ${community.name}? You'll need a new invite to rejoin.`)) return;
    leaveCommunity.mutate(community.slug ?? community.id);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>My Communities</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "24px 0" }}>Loading…</p>
        ) : communities.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 13, padding: "24px 0" }}>
            You haven't joined any communities yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {communities.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14,
                  padding: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#1C2B8A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: "hidden" }}>
                  {c.logo?.url ? (
                    <img src={c.logo.url} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    getInitials(c.name) || "?"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>{c.owned ? "Admin" : "Member"}</p>
                </div>
                {!c.owned && (
                  <button
                    onClick={() => handleLeave(c)}
                    disabled={leaveCommunity.isPending}
                    title="Leave community"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#DC2626", flexShrink: 0 }}
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
