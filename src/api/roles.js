import client from "./client";

// Community roles — assignable within a community (ADMIN, MEMBER, etc.)
export const getRoles              = (params)          => client.get("/roles/community", { params });
export const getCommunityRole      = (roleIdentifier)  => client.get(`/roles/community/${roleIdentifier}`);

// Platform roles — platform-wide role definitions
export const getPlatformRoles      = (params)          => client.get("/roles/platform", { params });
export const getPlatformRole       = (roleIdentifier)  => client.get(`/roles/platform/${roleIdentifier}`);
