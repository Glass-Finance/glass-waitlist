// pages/dashboard/JoinRequests.jsx
import { Users } from "lucide-react";
import { useJoinRequests } from "../../hooks/useJoinRequests";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
// assumes activeCommunityId comes from wherever your dashboard already
// tracks the currently-selected community (e.g. a context or route param)

export default function JoinRequests() {
  const communityId = useActiveCommunityId();
  const { requests, isLoading, approve, reject, isMutating } =
    useJoinRequests(communityId);

  if (isLoading) return <LoadingState className="py-8" />;
  if (!requests.length) {
    return (
      <EmptyState
        icon={Users}
        title="No pending join requests"
        subtitle="When someone asks to join this community, their request will show up here for you to approve or reject."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {requests.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #eee",
          }}
        >
          <div>
            <p style={{ fontWeight: 600 }}>
              {r.user?.firstName} {r.user?.lastName}
            </p>
            <p style={{ fontSize: 13, color: "#888" }}>{r.user?.email}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={isMutating}
              onClick={() => reject(r.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #DC2626",
                background: "#fff",
                color: "#DC2626",
              }}
            >
              Reject
            </button>
            <button
              disabled={isMutating}
              onClick={() => approve(r.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#002FA7",
                color: "#fff",
              }}
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
