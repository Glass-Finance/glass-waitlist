import client from "./client";

// POST /api/v1/realtime/ticket — mint a short-lived, single-use ticket for
// opening the SSE stream. EventSource can't send an Authorization header,
// so the stream authenticates with ?ticket= instead; a fresh ticket must be
// minted for every (re)connection attempt.
export const mintRealtimeTicket = () => client.post("/realtime/ticket");
