import { useEffect, useRef } from "react";
import { Crisp } from "crisp-sdk-web";
import { useAuth } from "../../store/AuthContext.jsx";
import { useCrispToken } from "../../hooks/useCrispToken";

// Support chat — configured once, then reconciled with the auth state.
//
// Session-binding rules (Crisp's own docs, incl. the known session-leak
// issue): the token is ALWAYS set/cleared before a session reset, and
// identity (email etc.) is (re)pushed AFTER every reset — a reset wipes
// session data, so pushing before it would silently lose the identity.
export default function CrispChat() {
  const { user, loading } = useAuth();
  const configured = useRef(false);
  // What the Crisp session is currently bound to — used to detect login,
  // logout and account switches (the switch case MUST unbind the previous
  // account first or its conversation shows up under the next one).
  const bound = useRef({ user: null, token: null });
  const websiteId = import.meta.env.VITE_CRISP_WEBSITE_ID;

  const { data: tokenId } = useCrispToken(user?.id);

  useEffect(() => {
    if (!websiteId || configured.current) return;
    // sessionMerge: a conversation started before signing in is merged into
    // the token session on first bind, so "I already asked about this"
    // survives the login step.
    Crisp.configure(websiteId, { sessionMerge: true });
    configured.current = true;
  }, [websiteId]);

  useEffect(() => {
    if (!websiteId || !configured.current || loading) return;

    const userId = user?.id ?? null;

    if (userId !== bound.current.user) {
      // Login / logout / account switch: unbind whatever was connected.
      if (bound.current.user !== null || bound.current.token !== null) {
        Crisp.setTokenId(); // no arg = clear the token
        Crisp.session.reset();
      }
      bound.current = { user: userId, token: null };
      if (!userId) return; // logged out — unbound, nothing else to do
    } else if (!userId) {
      return; // anonymous visitor, nothing changed
    }

    // Bind the token once it has resolved for this user. While it's still
    // loading we identify immediately (agents see the user right away) and
    // the reset below simply runs again when the token arrives.
    if (tokenId === undefined) {
      // token query still in flight — fall through to identity push
    } else if (tokenId && tokenId !== bound.current.token) {
      Crisp.setTokenId(tokenId);
      Crisp.session.reset();
      bound.current.token = tokenId;
    } else if (!tokenId && bound.current.token) {
      Crisp.setTokenId();
      Crisp.session.reset();
      bound.current.token = null;
    }

    // Data minimization: email + internal id + role only. Phone and any
    // financial data stay out of the third-party chat log (NDPR) — the id
    // is enough for an agent to look the account up.
    Crisp.user.setEmail(user.email);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) Crisp.user.setNickname(name);
    const sessionData = { user_id: userId };
    if (user.role) sessionData.role = user.role;
    Crisp.session.setData(sessionData);
  }, [loading, user, tokenId, websiteId]);

  return null;
}
