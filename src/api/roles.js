import client from "./client";

// GET /api/v1/roles — community-scoped roles (e.g. ADMIN, MEMBER, TREASURER)
export const getRoles = () => client.get("/roles");
