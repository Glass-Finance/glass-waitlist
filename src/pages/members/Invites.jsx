import { useInvites } from "../../hooks/useInvites";
import { useNavigate } from "react-router-dom";

export default function InvitesEmptyState() {
  const navigate = useNavigate();

  const { invites, loading, accept, reject } = useInvites();

  async function handleAccept(invite) {
    await accept(invite.communityId, invite.id);

    navigate("/member/home");
  }

  async function handleReject(invite) {
    await reject(invite.communityId, invite.id);
  }

  if (loading) {
    return <p>Loading invites...</p>;
  }

  if (invites.length === 0) {
    return <div>No community invitations yet.</div>;
  }

  return (
    <div>
      {invites.map((invite) => (
        <div key={invite.id}>
          <h3>{invite.communityName}</h3>

          <button onClick={() => handleAccept(invite)}>Accept</button>

          <button onClick={() => handleReject(invite)}>Decline</button>
        </div>
      ))}
    </div>
  );
}
