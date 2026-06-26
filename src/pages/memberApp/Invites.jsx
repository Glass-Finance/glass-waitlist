import { useInvites } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail } from "lucide-react";

function Avatar({ name }) {
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
      }}
    >
      {initials}
    </div>
  );
}

export default function Invites() {
  const navigate = useNavigate();
  const { invites, isLoading, error, accept, reject, isAccepting, isRejecting, refresh } =
    useInvites();

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
          onClick={() => navigate(-1)}
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
        {isLoading ? (
          <p style={{ fontSize: 13, color: "#888", padding: "24px 4px" }}>
            Loading invites...
          </p>
        ) : error ? (
          <p style={{ fontSize: 13, color: "#DC2626", padding: "24px 4px" }}>
            Couldn't load invitations. Try again later.
          </p>
        ) : invites.length === 0 ? (
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
              Ask a community admin to send you an invite link, or have them add you directly by your email or phone number.
            </p>
            <button
              onClick={refresh}
              disabled={isLoading}
              style={{
                marginTop: 6,
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
          invites.map((invite) => (
            <div
              key={invite.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
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
                <Avatar name={invite.community?.name} />
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
          ))
        )}
      </div>
    </div>
  );
}
