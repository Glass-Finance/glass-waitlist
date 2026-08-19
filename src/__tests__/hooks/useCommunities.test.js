import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAllCommunityTransactions } from "../../hooks/useCommunities";
import { getCommunityTransactions } from "../../api/transactions";

vi.mock("../../api/transactions", () => ({ getCommunityTransactions: vi.fn() }));

// Regression: this used to fetch a single page and treat it as the whole
// list, silently understating a community's "Total Collected" figure once
// it had more transactions than fit in one page (see AUDIT_REPORT.md, F03).

function tx(id) {
  return { id, status: "SUCCESS", amount: 100 };
}

function pagedResponse(content, { last }) {
  return { data: { data: { content, last } } };
}

beforeEach(() => {
  getCommunityTransactions.mockReset();
});

describe("fetchAllCommunityTransactions", () => {
  it("stops after one call when the first page is already the last", async () => {
    getCommunityTransactions.mockResolvedValueOnce(
      pagedResponse([tx("t1"), tx("t2")], { last: true }),
    );

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2")]);
    expect(getCommunityTransactions).toHaveBeenCalledTimes(1);
    expect(getCommunityTransactions).toHaveBeenCalledWith("community-1", { pageNumber: 0 });
  });

  it("pages through until the envelope reports last:true, concatenating every page", async () => {
    getCommunityTransactions
      .mockResolvedValueOnce(pagedResponse([tx("t1")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([tx("t2")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([tx("t3")], { last: true }));

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2"), tx("t3")]);
    expect(getCommunityTransactions).toHaveBeenCalledTimes(3);
    expect(getCommunityTransactions).toHaveBeenNthCalledWith(1, "community-1", { pageNumber: 0 });
    expect(getCommunityTransactions).toHaveBeenNthCalledWith(2, "community-1", { pageNumber: 1 });
    expect(getCommunityTransactions).toHaveBeenNthCalledWith(3, "community-1", { pageNumber: 2 });
  });

  it("stops on an empty page even without an explicit last:true, instead of looping forever", async () => {
    getCommunityTransactions
      .mockResolvedValueOnce(pagedResponse([tx("t1")], { last: false }))
      .mockResolvedValueOnce(pagedResponse([], { last: false }));

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1")]);
    expect(getCommunityTransactions).toHaveBeenCalledTimes(2);
  });

  it("treats a plain-array response (no pagination envelope) as already complete", async () => {
    getCommunityTransactions.mockResolvedValueOnce({ data: { data: [tx("t1"), tx("t2")] } });

    const result = await fetchAllCommunityTransactions("community-1");

    expect(result).toEqual([tx("t1"), tx("t2")]);
    expect(getCommunityTransactions).toHaveBeenCalledTimes(1);
  });
});
