import { useAuth } from "../store/AuthContext.jsx";

// The Crisp session-continuity token.
//
// The backend does not mint a chat-specific token: GET /user/me returns the
// account's stable `externalReference` (auth.users.external_user_reference —
// uuid NOT NULL UNIQUE, updatable = false), which AuthContext maps onto `user`
// during hydration. So there is no request to make here and no second copy of
// the value to keep in sync.
//
// Why that value is safe to hand a third party: it is a random UUID, never an
// email address or a sequential id, and it is opaque to us — Crisp stores it to
// link conversations, nothing in this app authorises on it.
//
// Return shape deliberately mirrors a query result, because that is how the
// consumer (CrispChat) reads it — `const { data: tokenId } = useCrispToken()`:
//   string    → token to pass to Crisp.setTokenId()
//   null      → signed out, or a /me response without the field; chat runs
//               without token-bound continuity instead of erroring
//
// No "still loading" state: a session restored from localStorage has no
// externalReference until GET /user/me resolves, so first paint reads as "no
// token". That is harmless — CrispChat only clears an already-bound token, and
// there is nothing bound yet — and the token binds as soon as hydration lands.
export function useCrispToken() {
  const { user } = useAuth();
  return { data: user?.externalReference ?? null };
}
