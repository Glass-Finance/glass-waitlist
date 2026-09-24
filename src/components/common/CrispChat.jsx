import { useEffect, useRef } from "react";
import { Crisp } from "crisp-sdk-web";
import { useAuth } from "../../store/AuthContext.jsx";

export default function CrispChat() {
  const { user, loading } = useAuth();
  const configured = useRef(false);
  const previousUserId = useRef(null);
  const websiteId = import.meta.env.VITE_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!websiteId) return;

    if (!configured.current) {
      Crisp.configure(websiteId);
      configured.current = true;
    }

    if (loading) return;

    if (previousUserId.current && previousUserId.current !== user?.id) {
      Crisp.setTokenId();
      Crisp.session.reset();
    }
    previousUserId.current = user?.id ?? null;

    if (!user) return;

    if (user.email) Crisp.user.setEmail(user.email);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) Crisp.user.setNickname(name);
    if (user.phoneNumber) Crisp.user.setPhone(user.phoneNumber);
    if (user.role) Crisp.session.setData({ role: user.role });
  }, [loading, user, websiteId]);

  return null;
}
