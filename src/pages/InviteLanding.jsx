import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const PENDING_INVITE_KEY = "glass_pending_invite";

export default function InviteLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isMember, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const inviteId = searchParams.get("inviteId");
    if (inviteId) {
      sessionStorage.setItem(PENDING_INVITE_KEY, inviteId);
    }

    if (isAuthenticated && isMember) {
      navigate("/member/invites", { replace: true });
    } else if (isAuthenticated && !isMember) {
      navigate("/dashboard/home", { replace: true });
    } else {
      navigate("/member/app-sign-in?return=/member/invites", { replace: true });
    }
  }, [loading, isAuthenticated, isMember, navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-sm text-gray-400">Redirecting…</p>
    </div>
  );
}
