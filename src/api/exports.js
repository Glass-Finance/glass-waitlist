import client from "./client";

export const getExportJobs = (params)      => client.get("/exports", { params });
export const getExportJob  = (exportJobId) => client.get(`/exports/${exportJobId}`);

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
