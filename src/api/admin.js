import client from "./client";

export const getSystemConfigs = (params) =>
  client.get("/admin/system-configs", { params });

export const getSystemConfig = (identifier) =>
  client.get(`/admin/system-configs/${identifier}`);

export const updateSystemConfig = (id, payload) =>
  client.patch(`/admin/system-configs/${id}`, payload);
