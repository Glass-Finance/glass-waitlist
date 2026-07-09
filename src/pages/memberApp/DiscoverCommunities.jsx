import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Users, Loader2, CheckCircle2, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";

// ─── API calls ────────────────────────────────────────────────────────────────
const searchPublicCommunities = (search) =>
  client.get("/public/communities/search", { params: { search, size: 30 } });

const submitJoinRequest = (communityIdentifier) =>
  client.post(`/communities/${communityIdentifier}/join-requests`);

// ─── Hook ─────────────────────────────────────────────────────────────────────
function usePublicSearch(query) {
  return useQuery({
    queryKey: ["public-communities", query],
    queryFn: async () => {
      const res = await searchPublicCommunities(query);
      const d = res.data?.data;
      return Array.isArray(d) ? d : (d?.content ?? []);
    },
    enabled: query.trim().length > 1,
    staleTime: 30_000,
  });
}

// ─── Category badge colours ───────────────────────────────────────────────────
const CAT_COLORS = {
  education:    { bg: "#E8F0FB", color: "#1C2B8A" },
  professional: { bg: "#F3E8FF", color: "#7c3aed" },
  religious:    { bg: "#FFF8E7", color: "#d4a017" },
  sports:       { bg: "#ECFDF5", color: "#059669" },
  social:       { bg: "#FFF0F0", color: "#E53E3E" },
};
function catStyle(cat = "") {
  return CAT_COLORS[cat.toLowerCase()] ?? { bg: "#F0F0F0", color: "#555" };
}

// ─── Single community card ────────────────────────────────────────────────────
function CommunityCard({ community, onRequest }) {
  const [status, setStatus] = useState(
    community.userJoinStatus ?? null  // "pending" | "member" | null
  );
  const [loading, setLoading] = useState(false);

  const { bg, color } = catStyle(community.category);

  const alreadyMember  = status === "member";
  const alreadyPending = status === "pending";

  async function handleRequest() {
    if (alreadyMember || alreadyPending || loading) return;
    setLoading(true);
    try {
      await onRequest(community.id ?? community.slug);
      setStatus("pending");
    } catch {
      // toast from the parent; just reset loading
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "14px 16px",
      border: "1px solid #EFEFEF",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: "#F0F0F0", border: "1px solid #E0E0E0",
          overflow: "hidden", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18,
        }}>
          {community.logoUrl
            ? <img src={community.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (community.name?.charAt(0) ?? "C")}
        </div>

        {/* Name + category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {community.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px",
              borderRadius: 99, background: bg, color,
            }}>
              {community.category ?? "Community"}
            </span>
            {community.memberCount != null && (
              <span style={{ display: "flex", alignItems: "center", gap: 3,
                fontSize: 11, color: "#888" }}>
                <Users size={11} />
                {community.memberCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {community.description && (
        <p style={{ fontSize: 12, color: "#555", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {community.description}
        </p>
      )}

      {/* Action button */}
      <button
        onClick={handleRequest}
        disabled={alreadyMember || alreadyPending || loading}
        style={{
          width: "100%", padding: "10px 0", borderRadius: 8,
          border: alreadyPending || alreadyMember ? "1.5px solid #E0E0E0" : "none",
          background: alreadyMember
            ? "#ECFDF5"
            : alreadyPending
            ? "#fff"
            : "#1C2B8A",
          color: alreadyMember ? "#059669" : alreadyPending ? "#888" : "#fff",
          fontSize: 13, fontWeight: 600, cursor: alreadyMember || alreadyPending ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "opacity 0.15s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {alreadyMember  && <CheckCircle2 size={13} />}
        {alreadyPending && <Clock size={13} />}
        {alreadyMember  ? "Already a member"
         : alreadyPending ? "Request sent"
         : "Request to Join"}
      </button>
    </div>
  );
}

// ─── Empty / idle states ──────────────────────────────────────────────────────
function EmptyState({ query }) {
  if (!query || query.length < 2) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60, color: "#aaa" }}>
        <Search size={32} strokeWidth={1.2} style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 14 }}>Search for a community by name</p>
        <p style={{ fontSize: 12, marginTop: 4 }}>e.g. "Kings College Alumni"</p>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center", paddingTop: 60, color: "#aaa" }}>
      <p style={{ fontSize: 14 }}>No communities found for "{query}"</p>
      <p style={{ fontSize: 12, marginTop: 4 }}>
        Try a shorter or different search term
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DiscoverCommunities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: results = [], isLoading, isFetching } = usePublicSearch(query);

  const joinMutation = useMutation({
    mutationFn: submitJoinRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
    },
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#F0F0F0",
      fontFamily: "'Inter', system-ui, sans-serif",
      paddingBottom: 40, maxWidth: 430, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "52px 20px 16px", position: "relative",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute", left: 20,
            width: 36, height: 36, borderRadius: "50%",
            background: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>
          Discover Communities
        </h1>
      </div>

      {/* Search input */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", borderRadius: 12, padding: "12px 14px",
          border: "1.5px solid #E0E0E0",
        }}>
          {isFetching
            ? <Loader2 size={15} className="animate-spin" style={{ color: "#1C2B8A", flexShrink: 0 }} />
            : <Search size={15} style={{ color: "#aaa", flexShrink: 0 }} />}
          <input
            autoFocus
            type="search"
            placeholder="Search communities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", fontSize: 14, color: "#111",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#aaa", fontSize: 18, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {isLoading && query.length > 1 ? (
          <div style={{ textAlign: "center", paddingTop: 48 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: "#1C2B8A" }} />
          </div>
        ) : results.length > 0 ? (
          results.map((c) => (
            <CommunityCard
              key={c.id ?? c.slug}
              community={c}
              onRequest={joinMutation.mutateAsync}
            />
          ))
        ) : (
          <EmptyState query={query} />
        )}
      </div>
    </div>
  );
}
