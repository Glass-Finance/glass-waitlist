import client from "./client";

export const getExportJobs = (params) => client.get("/exports", { params });
export const getExportJob = (exportJobId) => client.get(`/exports/${exportJobId}`);

// Community-scoped export triggers (returns an export job immediately; poll
// getExportJob until status === "COMPLETED" to get the fileData.url)
export const exportCommunityTransactions = (communityIdentifier, params, format = "CSV") =>
  client.post(`/communities/${communityIdentifier}/finance/transactions/export`, null, {
    params: { ...params, format },
  });

export const exportCommunityObligations = (communityIdentifier, params, format = "CSV") =>
  client.post(`/communities/${communityIdentifier}/finance/obligations/export`, null, {
    params: { ...params, format },
  });

export const exportCommunitySettlements = (communityIdentifier, params, format = "CSV") =>
  client.post(`/communities/${communityIdentifier}/finance/settlements/export`, null, {
    params: { ...params, format },
  });

// ── Member-scoped ("me") exports ──
// Same ExportScope.USER job pipeline as the community-scoped triggers above, so
// they reuse useExportJob unchanged: POST returns a job, poll GET
// /exports/{id} (which is scoped to the caller) for fileData.url.

// POST /api/v1/finance/obligations/me/export
export const exportMyObligations = (params, format = "CSV") =>
  client.post("/finance/obligations/me/export", null, {
    params: { ...params, format },
  });

// POST /api/v1/finance/transactions/me/export
export const exportMyTransactions = (params, format = "CSV") =>
  client.post("/finance/transactions/me/export", null, {
    params: { ...params, format },
  });
