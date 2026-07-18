import { useState } from "react";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, LogOut, Plus, Users, X } from "lucide-react";
import { useMyCommunities, useLeaveCommunity } from "../../../../hooks/useMyAccount";
import { resolveIsPayingAdmin } from "../../../../utils/communityRole";
import PageLoadingState from "../../../../components/common/PageLoadingState";
import EmptyState from "../../../../components/common/EmptyState";

function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function setActiveMemberCommunity(c) {
  try {
    localStorage.setItem(
      "glass_member_community",
      JSON.stringify({ id: c.id, slug: c.slug, name: c.name })
    );
  } catch {
    /* ignore */
  }
}

// Real in-app disclaimer instead of the bare OS window.confirm() this used
// to rely on -- explains what leaving actually costs (payment history
// visibility, needing a fresh invite) rather than a one-line browser popup
// that's easy to blow past without reading.
function LeaveConfirmModal({ community, onCancel, onConfirm, leaving }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60, display: "flex",
        alignItems: "flex-end", justifyContent: "center",
        background: "rgba(15,23,42,0.45)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 430, background: "#fff",
          borderRadius: "20px 20px 0 0", padding: "24px 20px 28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF" }}
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
            <AlertTriangle size={24} style={{ color: "#DC2626" }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#111", margin: 0 }}>
            Leave {community?.name}?
          </p>
          <p style={{ fontSize: 13.5, color: "#6B7280", margin: 0, lineHeight: 1.55, maxWidth: 320 }}>
            You'll lose access to this community's payment history and upcoming dues from your account, and you'll need a new invite to rejoin. This can't be undone from your side.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <button
            onClick={onConfirm}
            disabled={leaving}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: "#DC2626", color: "#fff", fontSize: 14.5, fontWeight: 600,
              cursor: leaving ? "default" : "pointer", opacity: leaving ? 0.7 : 1,
            }}
          >
            {leaving ? "Leaving…" : "Yes, leave community"}
          </button>
          <button
            onClick={onCancel}
            disabled={leaving}
            className="border border-surface-container-border"
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "#fff", color: "#374151",
              fontSize: 14.5, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyCommunities() {
  const navigate = useNavigate();
  const { data: raw = [], isLoading } = useMyCommunities();
  const communities = raw.map((c) => ({
    ...c,
    name: c.name ?? c.community?.name,
    slug: c.slug ?? c.community?.slug,
    logo: c.logo ?? c.community?.logo,
    id: c.id ?? c.community?.id,
  }));
  const leaveCommunity = useLeaveCommunity();
  const [navigatingId, setNavigatingId] = useState(null);
  const [leavingCommunity, setLeavingCommunity] = useState(null);

  async function handleSelect(c) {
    if (c.owned) {
      setNavigatingId(c.id);
      try {
        localStorage.setItem("glass_community", JSON.stringify(c));
        const isPaying = await resolveIsPayingAdmin(c.slug ?? c.id);
        const path = isPaying
          ? `/dashboard/admin/paying?community=${c.slug}`
          : `/dashboard/admin?community=${c.slug}`;
        navigate(path);
      } finally {
        setNavigatingId(null);
      }
    } else {
      setActiveMemberCommunity(c);
      navigate("/member/home");
    }
  }

  function handleLeave(e, c) {
    e.stopPropagation();
    setLeavingCommunity(c);
  }

  function confirmLeave() {
    if (!leavingCommunity) return;
    leaveCommunity.mutate(leavingCommunity.slug ?? leavingCommunity.id, {
      onSuccess: () => setLeavingCommunity(null),
    });
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh",  fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <GlassLogoGlow />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>My Communities</h1>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <button
          onClick={() => navigate("/onboarding/choose-path")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "12px", borderRadius: 12, background: "#1C2B8A",
            color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
          }}
        >
          <Plus size={16} />
          Create a Community
        </button>
      </div>

      <div className="px-4">
        {isLoading ? (
          <PageLoadingState size={56} padding="36px 24px" />
        ) : communities.length === 0 ? (
          <EmptyState icon={Users} title="You haven't joined any communities yet" className="py-6" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {communities.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                disabled={navigatingId === c.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, background: "#fff",
                  borderRadius: 14, padding: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  border: "none", cursor: navigatingId === c.id ? "default" : "pointer",
                  textAlign: "left", width: "100%", opacity: navigatingId === c.id ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: c.logo?.url ? "transparent" : "#1C2B8A",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: "hidden",
                  }}
                >
                  {c.logo?.url ? (
                    <img src={c.logo.url} alt="" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(c.name) || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>{c.owned ? "Admin" : "Member"}</p>
                </div>
                {!c.owned ? (
                  <button
                    onClick={(e) => handleLeave(e, c)}
                    disabled={leaveCommunity.isPending}
                    title="Leave community"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#DC2626", flexShrink: 0 }}
                  >
                    <LogOut size={16} />
                  </button>
                ) : navigatingId === c.id ? (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--color-surface-container-border)", borderTopColor: "#002FA7", flexShrink: 0, animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <ChevronRight size={16} style={{ color: "#ccc", flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {leavingCommunity && (
        <LeaveConfirmModal
          community={leavingCommunity}
          leaving={leaveCommunity.isPending}
          onCancel={() => setLeavingCommunity(null)}
          onConfirm={confirmLeave}
        />
      )}
    </div>
  );
}
