import { useMemo, useState } from "react";
import { UserPlus, Check, X, Mail, Phone, Clock } from "lucide-react";
import {
  useJoinRequests,
  requesterOf,
  requestStatusOf as statusOf,
} from "../../hooks/useJoinRequests";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePageTitle } from "../../hooks/usePageTitle";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

function formatRequestedAt(r) {
  const raw = r.createdAt ?? r.requestedAt ?? r.submittedAt ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.floor(mins / (60 * 24))}d ago`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_CHIP = {
  APPROVED: { label: "Approved", bg: "#ECFDF5", color: "#059669" },
  REJECTED: { label: "Rejected", bg: "#FEF2F2", color: "#DC2626" },
  CANCELLED: { label: "Cancelled", bg: "var(--color-stacked-container)", color: "#6B7280" },
  EXPIRED: { label: "Expired", bg: "var(--color-stacked-container)", color: "#6B7280" },
};

function Avatar({ requester }) {
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-100"
      style={{ background: "#EEF2FF" }}
    >
      {requester.image ? (
        <img src={requester.image} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-brand">{requester.initials}</span>
      )}
    </div>
  );
}

function RequestCard({ r, onApprove, onReject, busy }) {
  const requester = requesterOf(r);
  const status = statusOf(r);
  const isPending = status === "PENDING";
  const requestedAt = formatRequestedAt(r);
  const reviewedAt = r.reviewedAt
    ? new Date(r.reviewedAt).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
      })
    : null;
  const chip = STATUS_CHIP[status];

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-surface-container rounded-xl"
      style={{ border: "1px solid var(--color-surface-container-border)" }}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <Avatar requester={requester} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate m-0">
            {requester.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {requester.email && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Mail size={11} className="flex-shrink-0" />
                <span className="truncate">{requester.email}</span>
              </span>
            )}
            {requester.phone && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Phone size={11} className="flex-shrink-0" />
                {requester.phone}
              </span>
            )}
            {requestedAt && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} className="flex-shrink-0" />
                Requested {requestedAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            disabled={busy}
            onClick={onReject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors disabled:opacity-50"
          >
            <X size={13} /> Reject
          </button>
          <button
            disabled={busy}
            onClick={onApprove}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand hover:opacity-90 border-none cursor-pointer transition-opacity disabled:opacity-50"
          >
            <Check size={13} /> Approve
          </button>
        </div>
      ) : (
        chip && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: chip.bg, color: chip.color }}
            >
              {chip.label}
            </span>
            {reviewedAt && (
              <span className="text-[11px] text-gray-400">on {reviewedAt}</span>
            )}
          </div>
        )
      )}
    </div>
  );
}

export default function JoinRequests() {
  usePageTitle("Join Requests");
  const communityId = useActiveCommunityId();
  const { requests, isLoading, error, approve, reject } =
    useJoinRequests(communityId);
  // Row-level busy state so approving one request doesn't freeze the rest.
  const [respondingId, setRespondingId] = useState(null);

  // Only PENDING requests are actionable — the backend rejects approve/
  // reject on anything else ("Only pending join requests can be approved").
  // Processed ones are shown below as read-only history.
  const { pending, processed } = useMemo(() => {
    const pending = [];
    const processed = [];
    for (const r of requests) {
      (statusOf(r) === "PENDING" ? pending : processed).push(r);
    }
    return { pending, processed };
  }, [requests]);

  async function respond(action, r) {
    setRespondingId(r.id);
    try {
      await action(r.id);
    } catch {
      // The global mutation error handler already toasts the reason
      // (e.g. "Only pending join requests can be approved").
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div
      className="flex flex-col h-full px-4 md:px-6 py-6 overflow-y-auto"
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className="mb-5 flex-shrink-0">
        <h1 className="text-xl font-bold text-black mb-1">Join Requests</h1>
        <p className="text-sm text-gray-400">
          Review who wants to join before letting them into your community.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">
          Couldn't load join requests. Please refresh.
        </p>
      )}

      {/* Pending */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider m-0">
          Awaiting review
        </p>
        {pending.length > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[#EEF2FF] text-brand border border-blue-100">
            {pending.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingState className="py-8" />
      ) : pending.length === 0 ? (
        <div className="bg-surface-container rounded-xl" style={{ border: "1px dashed var(--color-surface-container-border)" }}>
          <EmptyState
            icon={UserPlus}
            title="No pending join requests"
            subtitle="New requests from Discover or invite links will show up here for you to approve or reject."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pending.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              busy={respondingId === r.id}
              onApprove={() => respond(approve, r)}
              onReject={() => respond(reject, r)}
            />
          ))}
        </div>
      )}

      {/* Processed history */}
      {processed.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-3">
            Recently processed
          </p>
          <div className="flex flex-col gap-2.5 pb-8">
            {processed.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
