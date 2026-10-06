import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCommunitySettlements,
  useCommunitySettlement,
} from "../../hooks/useCommunitySettlements";

const { mockList, mockDetail } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockDetail: vi.fn(),
}));

vi.mock("../../api/transactions", () => ({
  getCommunitySettlements: (...args) => mockList(...args),
  getCommunitySettlement: (...args) => mockDetail(...args),
}));

// The axios envelope: PageResponse<T> arrives at res.data.data.
function envelope(data) {
  return { data: { data } };
}

function page(content, overrides = {}) {
  return {
    content,
    pageNumber: 2,
    pageSize: 20,
    totalElements: content.length,
    totalPages: 5,
    ...overrides,
  };
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockList.mockReset();
  mockDetail.mockReset();
});

describe("useCommunitySettlements", () => {
  it("unwraps the paged envelope into content + totals", async () => {
    mockList.mockResolvedValue(
      envelope(
        page([
          { id: "s1", status: "SUCCESS" },
          { id: "s2", status: "PENDING" },
        ]),
      ),
    );

    const { result } = renderHook(() => useCommunitySettlements("glass-crew"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.content).toHaveLength(2);
    expect(result.current.data.totalPages).toBe(5);
    expect(result.current.data.pageNumber).toBe(2);
    // Identifier first, params second — the call shape other community hooks use.
    expect(mockList).toHaveBeenCalledWith("glass-crew", {});
  });

  it("survives a bare-array payload and fills in paging defaults", async () => {
    mockList.mockResolvedValue(envelope([{ id: "s1" }]));

    const { result } = renderHook(() => useCommunitySettlements("glass-crew"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.content).toHaveLength(1);
    expect(result.current.data.totalPages).toBe(1);
    expect(result.current.data.pageNumber).toBe(1);
  });

  it("does not fetch without a community id", async () => {
    renderHook(() => useCommunitySettlements(null), { wrapper: wrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockList).not.toHaveBeenCalled();
  });

  it("returns the error rather than throwing it", async () => {
    // A 403 is an expected state here: the endpoints require
    // community.reconciliation.read, which plain members don't hold.
    mockList.mockRejectedValue({ response: { status: 403 } });

    const { result } = renderHook(() => useCommunitySettlements("glass-crew"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(403);
  });
});

describe("useCommunitySettlement", () => {
  it("returns the settlement with its transactions", async () => {
    mockDetail.mockResolvedValue(
      envelope({
        id: "s1",
        gross: 250000,
        status: "SUCCESS",
        transactions: [{ id: "t1", amount: 25000, matched: true }],
      }),
    );

    const { result } = renderHook(() => useCommunitySettlement("glass-crew", "s1"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.transactions).toHaveLength(1);
    expect(mockDetail).toHaveBeenCalledWith("glass-crew", "s1");
  });

  it("keeps a 404 as an error, since MISMATCHED/REVIEWED rows 404 by design", async () => {
    mockDetail.mockRejectedValue({ response: { status: 404 } });

    const { result } = renderHook(() => useCommunitySettlement("glass-crew", "s9"), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.response.status).toBe(404);
  });

  it("does not fetch without a settlement id", async () => {
    renderHook(() => useCommunitySettlement("glass-crew", null), { wrapper: wrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockDetail).not.toHaveBeenCalled();
  });
});
