import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TransactionDetail from "../../../pages/dashboard/TransactionDetail";
import { useCommunityTransactionDetail } from "../../../hooks/useCommunityTransactionDetail";

// Admin transaction detail: load/error/success rendering, the copy-reference
// action, share-receipt modal, and Back navigation.

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});
vi.mock("../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: vi.fn(() => "comm-1"),
}));
vi.mock("../../../hooks/useCommunityTransactionDetail", () => ({
  useCommunityTransactionDetail: vi.fn(),
}));
vi.mock("../../../components/common/ReceiptModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="receipt-modal">
      <button onClick={onClose}>Close receipt</button>
    </div>
  ),
}));

const tx = {
  id: "tx-1",
  amount: 150000,
  amountPaid: 150000,
  description: "Monthly dues payment",
  communityName: "Kings College Alumni",
  communitySlug: "kca",
  communityLogo: null,
  date: "2026-07-11T09:30:00.000Z",
  status: "success",
  planName: "monthly dues",
  channel: "card",
  transactionType: null,
  reference: "TXN-REF-123",
  payerName: "amina bello",
  payerEmail: "amina@example.com",
  payerPhoto: null,
  feeMinor: null,
  initiatedBy: null,
};

function setQuery(overrides = {}) {
  useCommunityTransactionDetail.mockReturnValue({
    data: tx,
    isLoading: false,
    error: null,
    ...overrides,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/transactions/tx-1"]}>
      <Routes>
        <Route path="/dashboard/transactions/:transactionId" element={<TransactionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  setQuery();
});

afterEach(cleanup);

describe("TransactionDetail — states", () => {
  it("shows the loading indicator and fetches by route id + active community", () => {
    setQuery({ data: undefined, isLoading: true, error: null });
    renderPage();

    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(useCommunityTransactionDetail).toHaveBeenCalledWith("comm-1", "tx-1");
    expect(screen.queryByText("Couldn't load this transaction.")).toBeNull();
  });

  it("shows the error message when the query fails", () => {
    setQuery({ data: undefined, isLoading: false, error: new Error("network") });
    renderPage();

    expect(screen.getByText("Couldn't load this transaction.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });
});

describe("TransactionDetail — success", () => {
  it("renders the full receipt with fee shown as a dash when absent", () => {
    renderPage();

    expect(screen.getByText("₦150,000.00")).toBeTruthy();
    expect(screen.getByText("Successful")).toBeTruthy();
    expect(screen.getByText("Kings College Alumni")).toBeTruthy();
    expect(screen.getByText("Monthly Dues")).toBeTruthy();
    expect(screen.getByText("Amina Bello")).toBeTruthy();
    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("₦150,000")).toBeTruthy();
    expect(screen.getByText("TXN-REF-123")).toBeTruthy();

    const feeRow = screen.getByText("Transaction Fee").parentElement;
    expect(within(feeRow).getByText("—")).toBeTruthy();

    // No initiator recorded → the conditional row stays out of the DOM.
    expect(screen.queryByText("Initiated by")).toBeNull();
  });

  it("renders the formatted fee and initiator when present", () => {
    setQuery({
      data: { ...tx, feeMinor: 3750, initiatedBy: "ops@kca.org" },
    });
    renderPage();

    const feeRow = screen.getByText("Transaction Fee").parentElement;
    expect(within(feeRow).getByText("₦3,750.00")).toBeTruthy();
    expect(screen.getByText("Initiated by")).toBeTruthy();
    expect(screen.getByText("ops@kca.org")).toBeTruthy();
  });

  it("copies the reference to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Copy transaction ID" }));

    // waitFor lets the resolved writeText promise (which flips the copied
    // icon state) flush inside act instead of warning afterwards.
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("TXN-REF-123"));
  });

  it("opens and closes the share-receipt modal", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Share Receipt" }));
    expect(screen.getByTestId("receipt-modal")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close receipt" }));
    expect(screen.queryByTestId("receipt-modal")).toBeNull();
  });

  it("navigates back when Back is clicked", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
