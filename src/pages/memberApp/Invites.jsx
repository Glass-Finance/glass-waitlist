import { useInvites, useMyJoinRequests } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Mail, Clock, Home, Info } from "lucide-react";
import { useCommunities } from "../../hooks/useCommunities";
import { getInvite } from "../../api/invites";
import { PENDING_INVITE_KEY } from "../InviteLanding";

function Avatar({ name, logo }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "#1C2B8A",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {logo?.url ? (
        <img src={logo.url} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </div>
  );
}

export default function Invites() {
  const navigate = useNavigate();
  const { invites, isLoading, error, accept, reject, isAccepting, isRejecting, refresh } =
    useInvites();
  const { joinRequests, isLoading: joinRequestsLoading } = useMyJoinRequests();
  const { data: communitiesData } = useCommunities();

  const isEmpty = !isLoading && !joinRequestsLoading && invites.length === 0 && joinRequests.length === 0;
  const isAlreadyMember = (communitiesData?.communities?.length ?? 0) > 0;

  // A "Review Invite" email link lands on /invite?inviteId=... which stashes
  // the id here before redirecting to this (unfiltered) list — resolve it
  // once so we can highlight/scroll to that specific invite, or tell the
  // user it's no longer pending instead of leaving them to guess why it's
  // not obviously there.
  const [highlightId, setHighlightId] = useState(null);
  const [staleNotice, setStaleNotice] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    const pendingId = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (!pendingId) return;
    sessionStorage.removeItem(PENDING_INVITE_KEY);

    getInvite(pendingId)
      .then((res) => {
        const invite = res.data?.data ?? res.data;
        if (invite?.status === "PENDING") {
          setHighlightId(pendingId);
        } else {
          setStaleNotice("That invite has already been responded to.");
        }
      })
      .catch(() => {
        setStaleNotice("That invite is no longer available — it may have expired or already been handled.");
      });
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    cardRefs.current[highlightId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, invites]);

  // Member was added directly by an admin (no pending invite needed) — send
  // them straight to home instead of leaving them on an empty invite page.
  useEffect(() => {
    if (isEmpty && isAlreadyMember) {
      navigate("/member/home", { replace: true });
    }
  }, [isEmpty, isAlreadyMember, navigate]);

  async function handleAccept(invite) {
    await accept(invite.id);
    navigate("/member/home");
  }

  async function handleReject(invite) {
    await reject(invite.id);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EBEBEB",
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "20px 16px 16px",
        }}
      >
        <button
          onClick={() => navigate("/member/home")}
          aria-label="Go back"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#333" }} />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 600, color: "#111", margin: 0 }}>
          Invitations
        </h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        {staleNotice && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FEF3C7",
              color: "#92400E",
              fontSize: 12.5,
              fontWeight: 500,
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <Info size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
            {staleNotice}
          </div>
        )}
        {isLoading || joinRequestsLoading ? (
          <p style={{ fontSize: 13, color: "#888", padding: "24px 4px" }}>
            Loading invites...
          </p>
        ) : error ? (
          <p style={{ fontSize: 13, color: "#DC2626", padding: "24px 4px" }}>
            Couldn't load invitations. Try again later.
          </p>
        ) : invites.length === 0 && joinRequests.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "60px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={22} strokeWidth={1.6} style={{ color: "#999" }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#333", margin: 0 }}>
              No invitations yet
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: 0, maxWidth: 260, lineHeight: 1.5 }}>
              If your admin has already added you, you're good to go — head to your home screen.
            </p>
            <button
              onClick={() => navigate("/member/home", { replace: true })}
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#002FA7",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Home size={14} />
              Go to Home
            </button>
            <button
              onClick={refresh}
              disabled={isLoading}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1.5px solid #002FA7",
                background: "#fff",
                color: "#002FA7",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Check Again
            </button>
          </div>
        ) : (
          <>
            {invites.map((invite) => (
              <div
                key={invite.id}
                ref={(el) => (cardRefs.current[invite.id] = el)}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 12,
                  boxShadow:
                    invite.id === highlightId
                      ? "0 0 0 2px #002FA7, 0 1px 6px rgba(0,0,0,0.06)"
                      : "0 1px 6px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <Avatar name={invite.community?.name} logo={invite.community?.logo} />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {invite.community?.name ?? "Community"}
                    </p>
                    <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
                      Invited you to join
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleReject(invite)}
                    disabled={isAccepting || isRejecting}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 8,
                      border: "1.5px solid #E5E7EB",
                      background: "#fff",
                      color: "#555",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={isAccepting || isRejecting}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "#002FA7",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}

            {/* Join requests the member submitted themselves via a community's
                generic shareable link — read-only, since the admin is the one
                who needs to act, not the member. */}
            {joinRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 12,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Avatar name={req.community?.name} logo={req.community?.logo} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {req.community?.name ?? "Community"}
                  </p>
                  <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
                    Your request to join is pending
                  </p>
                </div>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#B45309",
                    background: "#FEF3C7",
                    padding: "5px 10px",
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  <Clock size={11} strokeWidth={2} />
                  Pending
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
