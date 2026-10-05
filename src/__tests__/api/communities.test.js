import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { fetchAllCommunityMembers } from "../../api/communities";

// Regression guard: fetchAllCommunityMembers must return EVERY active member.
//
// It previously issued ONE request with no pageSize, so it silently inherited
// the backend's default pageSize of 10. Every community above 10 active members
// was truncated, which pinned the Communities Home and dashboard member counts
// to 10 and capped the Members table's obligation/transaction join.
//
// It now paginates: pageSize=200, 1-based pageNumber, sequential pages,
// terminated by `last` with `totalPages` as the defensive second signal.
// The PageResponse envelope is NOT exposed — callers still receive a flat array,
// so the shared ["community", id, "members"] cache shape is unchanged.
//
// Retained note on pagination semantics: there is no page-size cap on this
// endpoint. AppConstant.PAGE_SIZE=10 is only the default when the parameter is
// absent. The historical 400 "Illegal Argument Entered" came from pageNumber=0
// (1-based, so 0 becomes PageRequest.of(-1, ...)), never from pageSize. See
// src/api/communityList.js for the corrected account with live evidence.

vi.mock("../../api/client", () => ({
  default: { get: vi.fn() },
}));

function member(id) {
  return { id, status: "ACTIVE" };
}

// A realistic single-page envelope. `last: true` means no second request.
function envelope(content, overrides = {}) {
  return {
    data: {
      data: {
        content,
        pageNumber: 1,
        pageSize: 200,
        totalElements: content.length,
        totalPages: 1,
        last: true,
        ...overrides,
      },
    },
  };
}

function requestedPageNumbers() {
  return client.get.mock.calls.map(([, config]) => config?.params?.pageNumber);
}

beforeEach(() => {
  client.get.mockReset();
});

describe("fetchAllCommunityMembers", () => {
  it("requests one page with status=ACTIVE, pageSize 200 and 1-based pageNumber 1", async () => {
    client.get.mockResolvedValueOnce(envelope([member("m1")]));

    await fetchAllCommunityMembers("community-1");

    expect(client.get).toHaveBeenCalledWith("/communities/community-1/members", {
      params: { status: "ACTIVE", pageSize: 200, pageNumber: 1 },
    });
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it("stops on last=true and returns the content array", async () => {
    client.get.mockResolvedValueOnce(envelope([member("m1"), member("m2")]));

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1"), member("m2")]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it("walks every page and concatenates contents in server order", async () => {
    client.get
      .mockResolvedValueOnce(
        envelope([member("m1"), member("m2")], {
          pageNumber: 1,
          totalElements: 5,
          totalPages: 3,
          last: false,
        }),
      )
      .mockResolvedValueOnce(
        envelope([member("m3"), member("m4")], {
          pageNumber: 2,
          totalElements: 5,
          totalPages: 3,
          last: false,
        }),
      )
      .mockResolvedValueOnce(
        envelope([member("m5")], {
          pageNumber: 3,
          totalElements: 5,
          totalPages: 3,
          last: true,
        }),
      );

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1"), member("m2"), member("m3"), member("m4"), member("m5")]);
    expect(requestedPageNumbers()).toEqual([1, 2, 3]);
  });

  it("terminates on totalPages when last is absent, without over-requesting", async () => {
    client.get
      .mockResolvedValueOnce(envelope([member("m1")], { last: undefined, totalPages: 2 }))
      .mockResolvedValueOnce(
        envelope([member("m2")], { pageNumber: 2, last: undefined, totalPages: 2 }),
      );

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1"), member("m2")]);
    expect(requestedPageNumbers()).toEqual([1, 2]);
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it("treats a first page with neither last nor totalPages as complete", async () => {
    client.get.mockResolvedValueOnce({
      data: { data: { content: [member("m1")] } },
    });

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1")]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it("returns [] for an empty result and does not request a second page", async () => {
    client.get.mockResolvedValueOnce(envelope([], { totalElements: 0, totalPages: 0, last: true }));

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it("stops after MAX_MEMBER_PAGES when pagination never terminates", async () => {
    // Never reports `last: true` and never converges totalPages.
    client.get.mockResolvedValue(envelope([member("m1")], { last: false, totalPages: 999999 }));

    const result = await fetchAllCommunityMembers("community-1");

    // Bounded, not infinite. MAX_MEMBER_PAGES pages of one member each.
    expect(client.get).toHaveBeenCalledTimes(200);
    expect(result).toHaveLength(200);
  });

  it("propagates a mid-walk failure instead of returning a partial roster", async () => {
    client.get
      .mockResolvedValueOnce(
        envelope([member("m1")], { totalPages: 2, totalElements: 2, last: false }),
      )
      .mockRejectedValueOnce(new Error("500 from page 2"));

    await expect(fetchAllCommunityMembers("community-1")).rejects.toThrow("500 from page 2");
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it("lets a caller override status (e.g. to fetch every status, not just ACTIVE)", async () => {
    client.get.mockResolvedValueOnce(envelope([member("m1")]));

    await fetchAllCommunityMembers("community-1", { status: undefined });

    expect(client.get.mock.calls[0][1].params.status).toBeUndefined();
  });

  it("lets a caller override pageSize but still pages 1-based", async () => {
    client.get
      .mockResolvedValueOnce(
        envelope([member("m1")], { totalPages: 2, totalElements: 2, last: false }),
      )
      .mockResolvedValueOnce(
        envelope([member("m2")], { pageNumber: 2, totalPages: 2, totalElements: 2, last: true }),
      );

    await fetchAllCommunityMembers("community-1", { pageSize: 1 });

    expect(client.get.mock.calls.map(([, config]) => config.params.pageSize)).toEqual([1, 1]);
    expect(requestedPageNumbers()).toEqual([1, 2]);
  });

  it("never sends pageNumber=0, which the backend rejects with 400", async () => {
    client.get.mockResolvedValueOnce(envelope([member("m1")]));

    await fetchAllCommunityMembers("community-1");

    for (const number of requestedPageNumbers()) {
      expect(number).toBeGreaterThanOrEqual(1);
    }
  });

  it("unwraps a plain-array payload with no envelope", async () => {
    client.get.mockResolvedValueOnce({ data: { data: [member("m1")] } });

    const result = await fetchAllCommunityMembers("community-1");

    expect(result).toEqual([member("m1")]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });
});
