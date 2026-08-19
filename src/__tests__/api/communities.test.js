import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { fetchAllCommunityMembers } from "../../api/communities";

// Regression: a single fetch capped at pageSize:1000 used to be treated as
// the whole roster, silently understating a community's headcount/member
// list for one with more members than that (see AUDIT_REPORT.md, F16).

vi.mock("../../api/client", () => ({
  default: { get: vi.fn() },
}));

function member(id) {
  return { id, status: "ACTIVE" };
}

function pagedResponse(content, { last }) {
  return { data: { data: { content, last } } };
}

beforeEach(() => {
  client.get.mockReset();
});

describe("fetchAllCommunityMembers", () => {
  it("defaults to status=ACTIVE and pageSize=1000", async () => {
    client.get.mockResolvedValueOnce(pagedResponse([member("m1")], { last: true }));

    await fetchAllCommunityMembers("community-1");

    expect(client.get).toHaveBeenCalledWith(
      "/communities/community-1/members",
      { params: { status: "ACTIVE", pageSize: 1000, pageNumber: 0 } },
    );
  });

  it("lets a caller override status (e.g. to fetch every status, not just ACTIVE)", async () => {
    client.get.mockResolvedValueOnce(pagedResponse([member("m1")], { last: true }));

    await fetchAllCommunityMembers("community-1", { status: undefined });

    expect(client.get.mock.calls[0][1].params.status).toBeUndefined();
  });

  it("pages through until the envelope reports last:true", async () => {
    client.get
      .mockResolvedValueOnce(pagedResponse([member("m1")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([member("m2")], { last: true }));

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1"), member("m2")]);
    expect(client.get).toHaveBeenCalledTimes(2);
  });
});
