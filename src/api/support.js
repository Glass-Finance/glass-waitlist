import client from "./client";

// Support-chat (Crisp) session continuity.
//
// Contract (backend not yet deployed — frontend degrades gracefully):
//   GET /user/crisp-token  →  { data: { tokenId: "<uuid-v4>" } }
//
// The token is generated server-side, stable per user, and used ONLY as the
// Crisp session-continuity token (binds a user's conversation across
// devices/browsers). It must never be a guessable value (email, user id) —
// Crisp documents guessable tokens as a chat-history takeover vector.
// A 404 while the endpoint is pending resolves to "no token" in the hook.
export const getCrispToken = () => client.get("/user/crisp-token");
