import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, Users } from "lucide-react";

const TABS = ["Payments", "Community", "Invites"];

const MOCK_INVITES = [
  {
    id: "1",
    name: "Arsenal Club Fans",
    category: "Football",
    description:
      "A community for passionate Arsenal supporters to connect, contribute, and celebrate every match together.",
    invitedBy: "Habeeb Abayomi",
    members: 390,
    timeAgo: "2 days ago",
    logo: null,
    logoColor: "#DB0007",
    logoText: "A",
  },
  {
    id: "2",
    name: "Lions Club International...",
    category: "Social Club",
    description:
      "Advancing community service, leadership, and social impact throughout Lagos",
    invitedBy: "Habeeb Abayomi",
    members: 390,
    timeAgo: "2 days ago",
    logo: null,
    logoColor: "#F5A623",
    logoText: "L",
  },
  {
    id: "3",
    name: "Ikoyi Club 1938 Members",
    category: "Social Club",
    description:
      "Connecting members through world-class recreation, networking, and community engagement.",
    invitedBy: "Habeeb Abayomi",
    members: 390,
    timeAgo: "2 days ago",
    logo: null,
    logoColor: "#888",
    logoText: "I",
  },
];

function InviteCard({ invite }) {
  const [status, setStatus] = useState("idle"); // idle | accepted | declined

  if (status === "accepted") {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "16px",
          marginBottom: 12,
          border: "1px solid #EFEFEF",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "#059669",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          ✓ Joined {invite.name}
        </p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "16px",
          marginBottom: 12,
          border: "1px solid #EFEFEF",
          opacity: 0.5,
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "#888",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          Invite declined
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "16px",
        marginBottom: 12,
        border: "1px solid #EFEFEF",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: invite.logoColor + "22",
              border: `1px solid ${invite.logoColor}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: invite.logoColor,
              flexShrink: 0,
            }}
          >
            {invite.logoText}
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#111",
                marginBottom: 1,
              }}
            >
              {invite.name}
            </p>
            <p style={{ fontSize: 12, color: "#888" }}>{invite.category}</p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <Clock size={11} style={{ color: "#aaa" }} />
          <span style={{ fontSize: 11, color: "#aaa" }}>{invite.timeAgo}</span>
        </div>
      </div>

      <div style={{ height: 1, background: "#0000000D", margin: "0 -16px 6px", padding: "0" }} />

      {/* Description */}
      <p
        style={{
          fontSize: 13,
          color: "#444",
          lineHeight: 1.55,
          marginBottom: 10,
        }}
      >
        {invite.description}
      </p>

      {/* Invited by + members */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <Users size={13} style={{ color: "#888" }} />
        <span style={{ fontSize: 12, color: "#555" }}>
          Invited by <span style={{ color: "#111" }}>{invite.invitedBy}</span>
        </span>
        <span style={{ fontSize: 12, color: "#aaa" }}>•</span>
        <span style={{ fontSize: 12, color: "#555" }}>
          <span style={{ color: "#111" }}>{invite.members}</span> Members
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setStatus("accepted")}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 4,
            border: "none",
            background: "#002FA7",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Accept
        </button>
        <button
          onClick={() => setStatus("declined")}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 4,
            border: "1.5px solid #002FA7",
            background: "#fff",
            color: "##002FA7",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export default function MemberNotifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Invites");

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
          justifyContent: "center",
          padding: "24px 20px 20px",
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
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>
          Notifications
        </h1>
      </div>

      {/* Tab bar */}
      <div
        style={{
          margin: "0 16px 20px",
          background: "#fff",
          borderRadius: 12,
          padding: 4,
          display: "flex",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 400,
              background: activeTab === tab ? "#EBEBEB" : "transparent",
              color: activeTab === tab ? "#111" : "#888",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px" }}>
        {activeTab === "Invites" &&
          MOCK_INVITES.map((invite) => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        {activeTab === "Payments" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ color: "#aaa", fontSize: 14 }}>
              No payment notifications.
            </p>
          </div>
        )}
        {activeTab === "Community" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ color: "#aaa", fontSize: 14 }}>
              No community notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
