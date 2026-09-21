import { act, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentSuccess from "../../../pages/memberApp/PaymentSuccess";
import { verifyPayment } from "../../../api/members";
import { beginAuthGrace } from "../../../api/client";
import { settleLocalPaymentForReference, useManagePayments } from "../../../hooks/usePayments";

vi.mock("../../../api/members", () => ({ verifyPayment: vi.fn() }));
vi.mock("../../../api/client", () => ({ beginAuthGrace: vi.fn() }));
vi.mock("../../../hooks/usePayments", () => ({
  settleLocalPaymentForReference: vi.fn(),
  useManagePayments: vi.fn(),
}));
vi.mock("../../../hooks/useTransactionDetail", () => ({
  useTransactionDetail: vi.fn(() => ({ data: null, isLoading: false })),
}));
vi.mock("../../../store/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: { email: "member@example.com" } })),
}));
vi.mock("../../../components/memberApp/GlassLogoGlow", () => ({
  default: () => null,
}));
vi.mock("../../../components/common/ReceiptModal", () => ({
  default: () => null,
}));
vi.mock("../../../components/common/SuccessBadge", () => ({
  default: ({ message }) => <div>{message}</div>,
}));
vi.mock("../../../components/ui/Button", () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

function renderPaymentSuccess() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/member/pay/ob-1/success?reference=ref-1"]}>
        <PaymentSuccess />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PaymentSuccess payment verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useManagePayments.mockReturnValue({ data: [], isLoading: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens auth grace immediately on mount", () => {
    verifyPayment.mockResolvedValue({
      data: { data: { status: "INITIATED" } },
    });

    renderPaymentSuccess();

    expect(beginAuthGrace).toHaveBeenCalledTimes(1);
  });

  it("keeps polling after FAILED and settles when a later poll succeeds", async () => {
    verifyPayment
      .mockResolvedValueOnce({ data: { data: { status: "FAILED" } } })
      .mockResolvedValueOnce({
        data: {
          data: { status: "SUCCESSFUL", transactionId: "tx-1" },
        },
      });

    renderPaymentSuccess();

    // Flush the mount-time verification effect. A single
    // `await Promise.resolve()` is only one microtask tick — under full-suite
    // CPU contention the async verify chain (await mock → setState) needs
    // more, so advance the fake clock instead, which drains both timers and
    // the resulting microtask queue.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(verifyPayment).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Confirming payment…")).toBeDefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    // The fired poll timer resolves verifyPayment asynchronously — flush the
    // continuation before asserting on its setState outcome.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(verifyPayment).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Transaction Successful")).toBeDefined();
    expect(settleLocalPaymentForReference).toHaveBeenCalledWith("ref-1", "tx-1");
  });

  it("does not settle the payment when verification remains failed", async () => {
    verifyPayment.mockResolvedValue({
      data: { data: { status: "FAILED" } },
    });

    renderPaymentSuccess();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(verifyPayment).toHaveBeenCalledTimes(1);
    expect(settleLocalPaymentForReference).not.toHaveBeenCalled();
    expect(screen.getByText("Confirming payment…")).toBeDefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(verifyPayment).toHaveBeenCalledTimes(2);
    expect(settleLocalPaymentForReference).not.toHaveBeenCalled();
    expect(screen.getByText("Confirming payment…")).toBeDefined();
  });

  it("settles with the transaction id returned by verification", async () => {
    verifyPayment.mockResolvedValueOnce({
      data: {
        data: {
          status: "SUCCESSFUL",
          transactionId: "transaction-456",
        },
      },
    });

    renderPaymentSuccess();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    // Same post-resolution flush as above: the settle call happens in the
    // promise continuation after verifyPayment resolves.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(verifyPayment).toHaveBeenCalledWith("ref-1", { _skipAuthRedirect: true });

    expect(settleLocalPaymentForReference).toHaveBeenCalledWith("ref-1", "transaction-456");

    expect(screen.getByText("Transaction Successful")).toBeDefined();
  });
});
