import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Users,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";
import { getMyCommunities } from "../../api/members";
import {
  recordPendingJoinRequest,
  getPendingJoinRequests,
  useJoinApprovalWatcher,
} from "../../hooks/useJoinApproval";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import LoadingState from "../../components/common/LoadingState";

function unwrapList(res) {
  const d = res.data?.data;
  return Array.isArray(d) ? d : (d?.content ?? []);
}

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
  education: { bg: "#E8F0FB", color: "#1C2B8A" },
  professional: { bg: "#F3E8FF", color: "#7c3aed" },
  religious: { bg: "#FFF8E7", color: "#d4a017" },
  sports: { bg: "#ECFDF5", color: "#059669" },
  social: { bg: "#FFF0F0", color: "#E53E3E" },
};
function catStyle(category) {
  // category is an array of strings from the API (e.g. ["education"])
  const cat = Array.isArray(category) ? category[0] : category;
  const key = typeof cat === "string" ? cat.toLowerCase() : "";
  return CAT_COLORS[key] ?? { bg: "#F0F0F0", color: "#555" };
}

// ─── Single community card ────────────────────────────────────────────────────
function CommunityCard({ community, derivedStatus, onRequest }) {
  // derivedStatus survives reloads (built from the member's own communities
  // list + locally tracked requests); the override reflects actions taken
  // on this render of the page.
  const [statusOverride, setStatusOverride] = useState(null);
  const status = statusOverride ?? derivedStatus ?? community.userJoinStatus ?? null;
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { bg, color } = catStyle(community.category);
  const alreadyMember = status === "member";
  const alreadyPending = status === "pending";
  const logoUrl = community.logo?.url ?? null;

  async function handleRequest() {
    if (alreadyMember || alreadyPending || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await onRequest(community.id ?? community.slug);
      const data = res?.data?.data ?? res?.data;
      const newStatus = (data?.status ?? "").toUpperCase();
      if (newStatus === "APPROVED") {
        setStatusOverride("member");
      } else {
        setStatusOverride("pending");
        // Track it so the button stays "Request sent" across reloads and
        // Home can show a "you're in" confirmation on approval.
        recordPendingJoinRequest({
          id: community.id,
          slug: community.slug,
          name: community.name,
        });
      }
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ?? "Couldn't send request. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid var(--color-outline-on-surface)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Logo */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            flexShrink: 0,
            background: logoUrl ? "transparent" : "#F0F0F0",
            border: logoUrl ? "none" : "1px solid #E0E0E0",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (community.name?.charAt(0) ?? "C")
          )}
        </div>

        {/* Name + category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#111",
              marginBottom: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {community.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                background: bg,
                color,
              }}
            >
              {(Array.isArray(community.category)
                ? community.category[0]
                : community.category) ?? "Community"}
            </span>
            {community.requiresMemberApproval === false && (
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                Open — join instantly
              </span>
            )}
            {community.memberCount != null && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  color: "#888",
                }}
              >
                <Users size={11} />
                {community.memberCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {community.description && (
        <p
          style={{
            fontSize: 12,
            color: "#555",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {community.description}
        </p>
      )}

      {/* Action button */}
      <button
        onClick={handleRequest}
        disabled={alreadyMember || alreadyPending || loading}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 8,
          border:
            alreadyPending || alreadyMember ? "1.5px solid #E0E0E0" : "none",
          background: alreadyMember
            ? "#ECFDF5"
            : alreadyPending
              ? "#fff"
              : "#1C2B8A",
          color: alreadyMember ? "#059669" : alreadyPending ? "#888" : "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: alreadyMember || alreadyPending ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "opacity 0.15s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        {alreadyMember && <CheckCircle2 size={13} />}
        {alreadyPending && <Clock size={13} />}
        {alreadyMember
          ? "Already a member"
          : alreadyPending
            ? "Request sent"
            : community.requiresMemberApproval === false
              ? "Join"
              : "Request to Join"}
      </button>
      {errorMsg && (
        <p
          style={{
            fontSize: 11.5,
            color: "#DC2626",
            margin: 0,
            textAlign: "center",
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}

// ─── Empty / idle states ──────────────────────────────────────────────────────
function EmptyState({ query }) {
  if (!query || query.length < 2) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 60,
          color: "#aaa",
        }}
      >
        <Search size={32} strokeWidth={1.2} style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 14, textAlign: "center" }}>
          Search for a community by name
        </p>
        <p style={{ fontSize: 12, marginTop: 4, textAlign: "center" }}>
          e.g. "Kings College Alumni"
        </p>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 60,
        color: "#aaa",
      }}
    >
      <p style={{ fontSize: 14, textAlign: "center" }}>
        No communities found for "{query}"
      </p>
      <p style={{ fontSize: 12, marginTop: 4, textAlign: "center" }}>
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

  // The member's own communities + locally tracked requests — so a reload
  // doesn't reset "Request sent"/"Already a member" back to a Join button.
  // Same query key/fn as the rest of the app: shares the cache, no extra fetch.
  const { data: myCommunities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => unwrapList(await getMyCommunities()),
    staleTime: 1000 * 60 * 5,
  });
  const pendingLocal = useMemo(() => getPendingJoinRequests(), []);

  // Only surfaced here -- this page is where a member is actively waiting
  // on a request, so it's the only place an approval landing mid-session
  // should interrupt with a popup. One at a time; dismissing (or opening
  // the community) reveals the next if more than one came through.
  const { approved: approvedJoins, dismiss: dismissJoin } = useJoinApprovalWatcher();
  const activeApproval = approvedJoins[0] ?? null;

  function openApprovedCommunity(entry) {
    try {
      localStorage.setItem(
        "glass_member_community",
        JSON.stringify({
          id: entry.communityId,
          slug: entry.communitySlug,
          name: entry.name,
        }),
      );
    } catch {
      /* ignore */
    }
    dismissJoin(entry);
    navigate("/member/home");
  }

  function derivedStatusFor(community) {
    const match = myCommunities.find(
      (c) =>
        (c.id ?? c.community?.id) === community.id ||
        (community.slug && (c.slug ?? c.community?.slug) === community.slug),
    );
    if (match) {
      const s = (match.memberStatus ?? "ACTIVE").toUpperCase();
      if (s === "ACTIVE") return "member";
      if (s === "PENDING") return "pending";
    }
    if (
      pendingLocal.some(
        (p) =>
          (p.id && p.id === community.id) ||
          (p.slug && community.slug && p.slug === community.slug),
      )
    ) {
      return "pending";
    }
    return null;
  }

  const joinMutation = useMutation({
    mutationFn: submitJoinRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      // An open community approves instantly — refresh the member's
      // communities so the new one appears on Home/My Communities right away.
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
         
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <GlassLogoGlow />
      {/* Header — before: padding: "52px 20px 16px" */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "35px 20px 16px",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1.5px solid #E0E0E0",
          }}
        >
          {isFetching ? (
            <Loader2
              size={15}
              className="animate-spin"
              style={{ color: "#1C2B8A", flexShrink: 0 }}
            />
          ) : (
            <Search size={15} style={{ color: "#aaa", flexShrink: 0 }} />
          )}
          <input
            autoFocus
            type="text"
            placeholder="Search communities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              color: "#111",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#aaa",
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div
        style={{
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {isLoading && query.length > 1 ? (
          <LoadingState label="Searching…" className="pt-12" />
        ) : results.length > 0 ? (
          results.map((c) => (
            <CommunityCard
              key={c.id ?? c.slug}
              community={c}
              derivedStatus={derivedStatusFor(c)}
              onRequest={joinMutation.mutateAsync}
            />
          ))
        ) : (
          <EmptyState query={query} />
        )}
      </div>

      {/* Join-request approved popup -- only shown here, while the member is
          actively waiting on this page. If the approval lands after they've
          already navigated away, this simply doesn't show; it's not
          persisted/resurfaced elsewhere. */}
      {activeApproval && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => e.target === e.currentTarget && dismissJoin(activeApproval)}
        >
          <div
            className="border border-surface-container-border"
            style={{
              width: "100%", maxWidth: 340,
              background: "#fff", borderRadius: 20,
              padding: "28px 24px", textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <span style={{ fontSize: 40, lineHeight: 1, display: "block", marginBottom: 12 }}>🎉</span>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#065F46", margin: "0 0 6px" }}>
              You're in!
            </p>
            <p style={{ fontSize: 13.5, color: "#374151", margin: "0 0 22px", lineHeight: 1.5 }}>
              Your request to join <strong>{activeApproval.name}</strong> was approved — you're now a member.
            </p>
            <button
              onClick={() => openApprovedCommunity(activeApproval)}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10,
                border: "none", background: "#059669", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 10,
              }}
            >
              Open Community
            </button>
            <button
              onClick={() => dismissJoin(activeApproval)}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                border: "none", background: "none", color: "#6B7280",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
