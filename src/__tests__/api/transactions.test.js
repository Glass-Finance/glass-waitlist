import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import {
  fetchAllCommunityTransactions,
  fetchAllCommunityObligations,
} from "../../api/transactions";

// Regression: a single fetch capped at pageSize:1000 used to be treated as
// the whole list, silently understating any total/count derived from it for
// a community with more than that (see AUDIT_REPORT.md, F03/F16). These
// helpers page through until the server says there's nothing left.

vi.mock("../../api/client", () => ({
  default: { get: vi.fn() },
}));

function tx(id) {
  return { id, status: "SUCCESS", amount: 100 };
}

function pagedResponse(content, { last }) {
  return { data: { data: { content, last } } };
}

beforeEach(() => {
  client.get.mockReset();
});

describe("fetchAllCommunityTransactions", () => {
  it("stops after one call when the first page is already the last", async () => {
    client.get.mockResolvedValueOnce(pagedResponse([tx("t1"), tx("t2")], { last: true }));

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2")]);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith(
      "/communities/community-1/finance/transactions",
      { params: { pageSize: 1000, pageNumber: 0 } },
    );
  });

  it("pages through until the envelope reports last:true, concatenating every page", async () => {
    client.get
      .mockResolvedValueOnce(pagedResponse([tx("t1")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([tx("t2")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([tx("t3")], { last: true }));

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2"), tx("t3")]);
    expect(client.get).toHaveBeenCalledTimes(3);
    expect(client.get.mock.calls[0][1].params.pageNumber).toBe(0);
    expect(client.get.mock.calls[1][1].params.pageNumber).toBe(1);
    expect(client.get.mock.calls[2][1].params.pageNumber).toBe(2);
  });

  it("stops on an empty page even without an explicit last:true, instead of looping forever", async () => {
    client.get
      .mockResolvedValueOnce(pagedResponse([tx("t1")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([], { last: false }));

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1")]);
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it("treats a plain-array response (no pagination envelope) as already complete", async () => {
    client.get.mockResolvedValueOnce({ data: { data: [tx("t1"), tx("t2")] } });

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2")]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });
});

describe("fetchAllCommunityObligations", () => {
  it("also pages through multiple pages, sharing the same underlying loop", async () => {
    client.get
      .mockResolvedValueOnce(pagedResponse([{ id: "o1" }], { last: false }))
      .mockResolvedValueOnce(pagedResponse([{ id: "o2" }], { last: true }));

    const result = await fetchAllCommunityObligations("community-1");

    expect(result).toEqual([{ id: "o1" }, { id: "o2" }]);
    expect(client.get).toHaveBeenCalledTimes(2);
    expect(client.get.mock.calls[0][0]).toBe("/communities/community-1/finance/obligations");
  });
});
