import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { fetchAllCommunityMembers } from "../../api/communities";

// Regression: a `pageSize:1000` default on this endpoint was found live to
// return 400 "Illegal Argument Entered" -- not silent truncation, a hard
// break for every community regardless of size. Unlike the sibling
// obligations/transactions endpoints (which do accept pageSize:1000 and are
// safely paginated in transactions.js), this one gets no page-size override
// and no pageNumber loop until its actual accepted range is confirmed
// against the real backend. These tests pin the reverted, single-fetch
// behavior so it doesn't regress back to the broken version.

vi.mock("../../api/client", () => ({
  default: { get: vi.fn() },
}));

function member(id) {
  return { id, status: "ACTIVE" };
}

function response(content) {
  return { data: { data: { content } } };
}

beforeEach(() => {
  client.get.mockReset();
});

describe("fetchAllCommunityMembers", () => {
  it("defaults to status=ACTIVE with no pageSize/pageNumber override", async () => {
    client.get.mockResolvedValueOnce(response([member("m1")]));

    await fetchAllCommunityMembers("community-1");

    expect(client.get).toHaveBeenCalledWith(
      "/communities/community-1/members",
      { params: { status: "ACTIVE" } },
    );
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it("lets a caller override status (e.g. to fetch every status, not just ACTIVE)", async () => {
    client.get.mockResolvedValueOnce(response([member("m1")]));

    await fetchAllCommunityMembers("community-1", { status: undefined });

    expect(client.get.mock.calls[0][1].params.status).toBeUndefined();
  });

  it("unwraps a paginated envelope's content array", async () => {
    client.get.mockResolvedValueOnce(response([member("m1"), member("m2")]));

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1"), member("m2")]);
  });

  it("unwraps a plain-array response with no envelope", async () => {
    client.get.mockResolvedValueOnce({ data: { data: [member("m1")] } });

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1")]);
  });
});
