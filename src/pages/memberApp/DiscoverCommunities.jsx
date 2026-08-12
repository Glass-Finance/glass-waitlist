import { useState } from "react";
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
import { getMyCommunities } from "../../api/members";
import { searchPublicCommunities } from "../../api/communities";
import { submitJoinRequest } from "../../api/invites";
import {
  recordPendingJoinRequest,
  useJoinApprovalWatcher,
} from "../../hooks/useJoinApproval";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";
import LoadingState from "../../components/common/LoadingState";
import JoinApprovedModal from "../../components/memberApp/JoinApprovedModal";

function unwrapList(res) {
  const d = res.data?.data;
  return Array.isArray(d) ? d : (d?.content ?? []);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function usePublicSearch(query) {
  return useQuery({
    queryKey: ["public-communities", query],
    queryFn: async () => {
      const res = await searchPublicCommunities({ search: query, size: 30 });
      const d = res.data?.data;
      return Array.isArray(d) ? d : (d?.content ?? []);
    },
    enabled: query.trim().length > 1,
    staleTime: 30_000,
  });
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

  const alreadyMember = status === "member";
  const alreadyPending = status === "pending";
  const logoUrl = community.logo?.url ?? null;
  const categoryLabel =
    (Array.isArray(community.category)
      ? community.category[0]
      : community.category) ?? "Community";
  // Field name unconfirmed against the public search response -- covers
  // every variant used elsewhere in the app (metrics.totalMembers is the
  // one the admin-scoped community endpoints use) so whichever one the
  // public endpoint actually sends still renders.
  const memberCount =
    community.memberCount ??
    community.membersCount ??
    community.totalMembers ??
    community.metrics?.totalMembers ??
    community.metrics?.activeMembers ??
    null;

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
    <div className="bg-white rounded-xl border border-outline-on-surface overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3.5 border-b border-outline-on-surface">
        {/* Logo */}
        <div
          className={`w-11 h-11 rounded-[10px] flex-shrink-0 overflow-hidden flex items-center justify-center text-lg ${logoUrl ? "bg-transparent border-none" : "bg-[#F0F0F0] border border-[#E0E0E0]"}`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            (community.name?.charAt(0) ?? "C")
          )}
        </div>

        {/* Name + category */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[#111] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {community.name}
          </p>
          <p className="text-sm text-[#888] overflow-hidden text-ellipsis whitespace-nowrap">
            {categoryLabel}
          </p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        {/* Description */}
        {community.description && (
          <p className="text-sm text-[#555] leading-[1.55]">
            {community.description}
          </p>
        )}

        {(memberCount != null ||
          community.requiresMemberApproval === false) && (
          <div className="flex items-center gap-3">
            {memberCount != null && (
              <span className="flex items-center gap-1.5 text-sm text-[#888]">
                <Users size={15} className="text-[#111]" />
                <span className="font-bold text-[#111]">
                  {memberCount.toLocaleString()}
                </span>
                Members
              </span>
            )}
            {community.requiresMemberApproval === false && (
              <span className="text-[11px] text-[#059669] font-semibold">
                Open — join instantly
              </span>
            )}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleRequest}
          disabled={alreadyMember || alreadyPending || loading}
          className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity duration-150 ${loading ? "opacity-70" : "opacity-100"} ${alreadyPending || alreadyMember ? "border-[1.5px] border-[#E0E0E0] cursor-default" : "border-none cursor-pointer"} ${
            alreadyMember
              ? "bg-[#ECFDF5] text-[#059669]"
              : alreadyPending
                ? "bg-white text-[#888]"
                : "bg-[#1C2B8A] text-white"
          }`}
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
                : "Request To Join"}
        </button>
        {errorMsg && (
          <p className="text-[11.5px] text-danger m-0 text-center">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Empty / idle states ──────────────────────────────────────────────────────
function EmptyState({ query }) {
  if (!query || query.length < 2) {
    return (
      <div className="flex flex-col items-center pt-[60px] text-[#aaa]">
        <Search size={32} strokeWidth={1.2} className="mb-2.5" />
        <p className="text-sm text-center">
          Search for a community by name
        </p>
        <p className="text-xs mt-1 text-center">
          e.g. "Kings College Alumni"
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center pt-[60px] text-[#aaa]">
      <p className="text-sm text-center">
        No communities found for "{query}"
      </p>
      <p className="text-xs mt-1 text-center">
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

  // Only surfaced here -- this page is where a member is actively waiting
  // on a request, so it's the only place an approval landing mid-session
  // should interrupt with a popup. One at a time; dismissing (or opening
  // the community) reveals the next if more than one came through.
  // `pending` comes from the same watcher, so a rejection resolved by an
  // admin mid-session flips the card back to "Request to Join" here too,
  // instead of only after the next reload.
  const {
    approved: approvedJoins,
    dismiss: dismissJoin,
    pending: pendingLocal,
  } = useJoinApprovalWatcher();
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
      className="relative overflow-hidden min-h-screen pb-10 max-w-[430px] mx-auto"
    >
      <GlassLogoGlow />
      {/* Header — before: padding: "52px 20px 16px" */}
      <div className="flex items-center justify-center relative pt-[35px] px-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-[18px] leading-6 font-medium text-[#111] m-0">
          Browse Communities
        </h1>
      </div>

      {/* Search input */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5 bg-white rounded-xl py-3 px-3.5 border-[1.5px] border-[#E0E0E0]">
          {isFetching ? (
            <Loader2
              size={15}
              className="animate-spin text-[#1C2B8A] flex-shrink-0"
            />
          ) : (
            <Search size={15} className="text-[#aaa] flex-shrink-0" />
          )}
          <input
            autoFocus
            type="text"
            placeholder="Search Community"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-none outline-none bg-transparent text-sm text-[#111]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="bg-transparent border-none cursor-pointer text-[#aaa] text-lg leading-none p-0"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 flex flex-col gap-2.5">
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

      {/* Join-request approved popup -- also watched from Home now, so an
          approval that lands after the member has already navigated away
          from this page still surfaces there instead of going unnoticed. */}
      <JoinApprovedModal
        entry={activeApproval}
        onOpen={openApprovedCommunity}
        onDismiss={dismissJoin}
      />
    </div>
  );
}
