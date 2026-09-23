import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTransactions } from "../../hooks/useTransactions";
import { usePayments } from "../../hooks/payments/useMainPayments";
import { useGlobalOverview } from "../../hooks/payments/useGlobalOverview";
import {
  getMyTransactions,
  getMyCommunities,
  getMyObligations,
  getPaymentLinks,
  getMe,
} from "../../api/members";

vi.mock("../../api/members", () => ({
  getMyTransactions: vi.fn(),
  getMyCommunities: vi.fn(),
  getMyObligations: vi.fn(),
  getPaymentLinks: vi.fn(),
  getMe: vi.fn(),
}));

const TRANSACTIONS_KEY = ["transactions"];
const ENVELOPE = (content) => ({ data: { data: { content, pageNumber: 0 } } });

// One backend list (GET /finance/transactions/me) read by three screens:
//   - useTransactions   → /member/transactions (Payment History)
//   - usePayments       → Home "Payment History" (data.history)
//   - useGlobalOverview → CommunitiesHome "Recent Activity"
const RAW_TRANSACTIONS = [
  {
    id: "t-old",
    amount: 1000,
    amountPaid: 1000,
    description: "Old dues",
    status: "SUCCESSFUL",
    paidAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T10:00:00.000Z",
    channel: "bank_transfer",
    currency: "NGN",
    internalReference: "ref-old",
    community: { name: "Alpha", slug: "alpha", logo: { url: "https://img/alpha.png" } },
    paymentLink: { id: "link-1", title: "Dues" },
    obligationId: "ob-1",
  },
  {
    id: "t-new",
    amount: 2000,
    amountPaid: 2000,
    description: "New dues",
    status: "FAILED",
    paidAt: "2026-02-01T10:00:00.000Z",
    createdAt: "2026-02-01T10:00:00.000Z",
    channel: "card",
    currency: "NGN",
    internalReference: "ref-new",
    community: { name: "Beta", slug: "beta" },
    paymentLink: { id: "link-2", title: "Fees" },
    obligationId: "ob-2",
  },
];

// Fields each of the three consumers actually reads.
const HISTORY_PAGE_FIELDS = ["id", "description", "communityName", "date", "amount", "status"]; // Transactions.jsx (TxRow + month grouping)
const HOME_ROW_FIELDS = ["description", "date", "amount", "status"]; // HomeSections.jsx HistoryRow
const OVERVIEW_ROW_FIELDS = ["id", "description", "communityName", "date", "amount", "status"]; // CommunitiesHome.jsx recent activity
const CANONICAL_FIELDS = ["communitySlug", "paymentLinkId", "obligationId"]; // shape.js contract

function mountAll() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // useTransactions first on purpose: it used to carry the divergent private
  // shaper, so it was the writer most likely to leave the other two screens
  // reading a shape they don't understand.
  const { result } = renderHook(
    () => ({
      paymentHistory: useTransactions(),
      home: usePayments(),
      overview: useGlobalOverview(),
    }),
    { wrapper },
  );

  return { queryClient, result };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem(
    "glass_member_community",
    JSON.stringify({ id: "c1", slug: "alpha", name: "Alpha" }),
  );
  getMyTransactions.mockResolvedValue(ENVELOPE(RAW_TRANSACTIONS));
  getMyCommunities.mockResolvedValue(
    ENVELOPE([
      { id: "c1", slug: "alpha", name: "Alpha", memberStatus: "ACTIVE" },
      { id: "c2", slug: "beta", name: "Beta", memberStatus: "ACTIVE" },
    ]),
  );
  getMyObligations.mockResolvedValue(ENVELOPE([]));
  getPaymentLinks.mockResolvedValue(ENVELOPE([]));
  getMe.mockResolvedValue({ data: { data: { id: "user-1" } } });
});

describe('F3 — ["transactions"] cache shape', () => {
  it("stores one canonical entry that satisfies all three consumers", async () => {
    const { queryClient, result } = mountAll();

    await waitFor(() => expect(result.current.paymentHistory.data).toHaveLength(2));
    await waitFor(() => expect(result.current.overview.recentActivity).toHaveLength(2));

    const entry = queryClient.getQueryData(TRANSACTIONS_KEY);
    expect(entry).toHaveLength(2);

    for (const tx of entry) {
      // Every field any of the three consumers reads must be present...
      for (const field of [
        ...HISTORY_PAGE_FIELDS,
        ...HOME_ROW_FIELDS,
        ...OVERVIEW_ROW_FIELDS,
        ...CANONICAL_FIELDS,
      ]) {
        expect(tx, `missing ${field}`).toHaveProperty(field);
      }
      // ...and the canonical shape's status normalisation still applies.
      expect(["success", "failed", "pending"]).toContain(tx.status);
    }

    expect(entry.map((t) => t.status)).toEqual(["success", "failed"]);
  });

  it("gives all three consumers the same representation of the same record", async () => {
    const { result } = mountAll();

    await waitFor(() => expect(result.current.paymentHistory.data).toHaveLength(2));
    await waitFor(() => expect(result.current.overview.recentActivity).toHaveLength(2));
    await waitFor(() => expect(result.current.home.data.history.length).toBeGreaterThan(0));

    const fromHistoryPage = result.current.paymentHistory.data.find((t) => t.id === "t-old");
    const fromHome = result.current.home.data.history.find((t) => t.id === "t-old");
    const fromOverview = result.current.overview.recentActivity.find((t) => t.id === "t-old");

    expect(fromHistoryPage).toBeDefined();
    expect(fromHome).toBeDefined();
    expect(fromOverview).toBeDefined();

    // Identical objects — no screen is reading a differently-shaped variant.
    expect(fromHome).toEqual(fromHistoryPage);
    expect(fromOverview).toEqual(fromHistoryPage);
    expect(fromHistoryPage.paymentLinkId).toBe("link-1");
    expect(fromHistoryPage.obligationId).toBe("ob-1");
    expect(fromHistoryPage.communitySlug).toBe("alpha");
  });

  it("keeps each screen's own ordering and scoping behaviour intact", async () => {
    const { result } = mountAll();

    await waitFor(() => expect(result.current.paymentHistory.data).toHaveLength(2));
    await waitFor(() => expect(result.current.overview.recentActivity).toHaveLength(2));
    await waitFor(() => expect(result.current.home.data.history).toHaveLength(1));

    // Payment History + Recent Activity sort newest-first.
    expect(result.current.paymentHistory.data.map((t) => t.id)).toEqual(["t-new", "t-old"]);
    expect(result.current.overview.recentActivity.map((t) => t.id)).toEqual(["t-new", "t-old"]);

    // Home stays scoped to the active community (Alpha), so the Beta record
    // is filtered out by communitySlug.
    expect(result.current.home.data.history.map((t) => t.id)).toEqual(["t-old"]);
    expect(result.current.home.data.history[0].communitySlug).toBe("alpha");
  });

  it("keeps all three consumers empty when the endpoint returns no transactions", async () => {
    getMyTransactions.mockResolvedValue(ENVELOPE([]));
    const { queryClient, result } = mountAll();

    await waitFor(() => expect(queryClient.getQueryData(TRANSACTIONS_KEY)).toEqual([]));

    expect(result.current.paymentHistory.data).toEqual([]);
    expect(result.current.home.data.history).toEqual([]);
    expect(result.current.overview.recentActivity).toEqual([]);
    expect(result.current.paymentHistory.error).toBeNull();
  });

  it("treats a 404 as an empty list rather than an error state", async () => {
    getMyTransactions.mockRejectedValue({ response: { status: 404 } });
    const { queryClient, result } = mountAll();

    await waitFor(() => expect(queryClient.getQueryData(TRANSACTIONS_KEY)).toEqual([]));

    expect(result.current.paymentHistory.data).toEqual([]);
    expect(result.current.paymentHistory.error).toBeNull();
    expect(result.current.overview.recentActivity).toEqual([]);
  });

  it("reaches the shared entry when invalidated", async () => {
    const { queryClient, result } = mountAll();
    await waitFor(() => expect(result.current.paymentHistory.data).toHaveLength(2));

    const before = getMyTransactions.mock.calls.length;
    await queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });

    await waitFor(() => expect(getMyTransactions.mock.calls.length).toBeGreaterThan(before));
    await waitFor(() => expect(queryClient.getQueryData(TRANSACTIONS_KEY)).toHaveLength(2));
  });
});
