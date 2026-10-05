import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import {
  fetchAllCommunityTransactions,
  fetchAllCommunityObligations,
  getCommunitySettlements,
  getCommunitySettlement,
} from "../../api/transactions";

// Regression: adding a `pageNumber` param to these endpoints was confirmed
// live to return 400 "Illegal Argument Entered" -- for a 1-member/
// low-activity community, so this isn't a page-2-and-beyond edge case, the
// very first request fails. These tests pin the reverted, single-fetch
// behavior (pageSize:1000, no pageNumber) so it doesn't regress back to the
// broken version.

vi.mock("../../api/client", () => ({
  default: { get: vi.fn() },
}));

function tx(id) {
  return { id, status: "SUCCESS", amount: 100 };
}

function response(content) {
  return { data: { data: { content } } };
}

beforeEach(() => {
  client.get.mockReset();
});

describe("fetchAllCommunityTransactions", () => {
  it("fetches once with pageSize:1000 and no pageNumber", async () => {
    client.get.mockResolvedValueOnce(response([tx("t1"), tx("t2")]));

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2")]);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith("/communities/community-1/finance/transactions", {
      params: { pageSize: 1000 },
    });
  });

  it("unwraps a plain-array response with no envelope", async () => {
    client.get.mockResolvedValueOnce({ data: { data: [tx("t1")] } });

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1")]);
  });
});

describe("fetchAllCommunityObligations", () => {
  it("fetches once with pageSize:1000 and no pageNumber", async () => {
    client.get.mockResolvedValueOnce(response([{ id: "o1" }]));

    const result = await fetchAllCommunityObligations("community-1");

    expect(result).toEqual([{ id: "o1" }]);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith("/communities/community-1/finance/obligations", {
      params: { pageSize: 1000 },
    });
  });
});

// The settlement paths are spelled inline in the api module on purpose:
// scripts/endpoint-audit.mjs extracts call paths with a regex that only matches
// a template literal sitting directly in the call, so composing them through a
// helper would make both routes look like frontend calls to routes that don't
// exist and (since the audit is --strict in CI) fail the build. Pinning the
// exact strings here keeps that indirection from creeping back in.
describe("community settlement routes", () => {
  beforeEach(() => {
    client.get.mockReset();
  });

  it("GETs the paged community settlement list", async () => {
    client.get.mockResolvedValueOnce({ data: { data: { content: [] } } });

    await getCommunitySettlements("glass-crew", { pageNumber: 1, pageSize: 20 });

    expect(client.get).toHaveBeenCalledWith("/communities/glass-crew/finance/settlements", {
      params: { pageNumber: 1, pageSize: 20 },
    });
  });

  it("GETs one settlement by id", async () => {
    client.get.mockResolvedValueOnce({ data: { data: { id: "s1" } } });

    await getCommunitySettlement("glass-crew", "s1");

    expect(client.get).toHaveBeenCalledWith("/communities/glass-crew/finance/settlements/s1");
  });
});
