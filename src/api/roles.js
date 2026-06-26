import client from "./client";

// GET /api/v1/roles/community — role definitions assignable within a
// community (ADMIN, MEMBER, TREASURER, etc.) — distinct from /roles/platform.
export const getRoles = () => client.get("/roles/community");
