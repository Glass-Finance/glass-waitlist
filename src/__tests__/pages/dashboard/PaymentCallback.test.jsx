import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PaymentCallback from "../../../pages/dashboard/PaymentCallback";
import { beginAuthGrace } from "../../../api/client";
import { verifyPayment } from "../../../api/members";
import {
  settleLocalPaymentForReference,
  peekPendingPaymentCtx,
} from "../../../hooks/usePayments";

vi.mock("../../../api/client", () => ({
  beginAuthGrace: vi.fn(),
}));

vi.mock("../../../api/members", () => ({
  verifyPayment: vi.fn(),
}));

vi.mock("../../../store/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    isAdmin: true,
    loading: false,
  })),
}));

vi.mock("../../../hooks/usePageTitle", () => ({
  usePageTitle: vi.fn(),
}));

vi.mock("../../../hooks/usePayments", () => ({
  settleLocalPaymentForReference: vi.fn(),
  peekPendingPaymentCtx: vi.fn(),
  findAuthorisationForPlan: vi.fn(),
  fetchAuthorisationsOnce: vi.fn(),
}));

vi.mock("../../../components/LoadingScreen", () => ({
  default: () => <div>Loading</div>,
}));

vi.mock("../../../pages/memberApp/PaymentSuccess", () => ({
  default: () => <div>Payment successful</div>,
}));

vi.mock("../../../components/common/SuccessBadge", () => ({
  default: () => <div>Success</div>,
}));

vi.mock("../../../components/ui/Button", () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

function renderCallback(initialEntry = "/payment/callback?reference=ref-1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PaymentCallback />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PaymentCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    peekPendingPaymentCtx.mockReturnValue({
      reference: "ref-1",
      paymentLinkId: "link-1",
      obligationId: "obl-1",
      feeMinor: 10000,
    });

    verifyPayment.mockResolvedValue({
      data: {
        data: {
          status: "success",
          reference: "ref-1",
          amount: 500000,
        },
      },
    });
  });

  it("opens auth grace when the callback page mounts", () => {
    renderCallback();

    expect(beginAuthGrace).toHaveBeenCalledTimes(1);
  });

  it("verifies the Paystack reference returned in the callback URL", async () => {
    renderCallback("/payment/callback?reference=ref-1");

    await waitFor(() => {
      expect(verifyPayment).toHaveBeenCalledWith(
        "ref-1",
        { _skipAuthRedirect: true },
      );
    });
  });

  it("settles the pending local payment after successful verification", async () => {
    renderCallback("/payment/callback?reference=ref-1");

    await waitFor(() => {
      expect(settleLocalPaymentForReference).toHaveBeenCalledWith("ref-1");
    });
  });

  it("uses the pending payment context after successful verification", async () => {
    renderCallback("/payment/callback?reference=ref-1");

    await waitFor(() => {
      expect(peekPendingPaymentCtx).toHaveBeenCalled();
    });
  });

  it("does not verify a payment when the callback has no reference", async () => {
    renderCallback("/payment/callback");

    await waitFor(() => {
      expect(verifyPayment).not.toHaveBeenCalled();
    });
  });

 
  
  it("does not settle the local payment when verification fails", async () => {
    verifyPayment.mockRejectedValueOnce({
      response: {
        data: {
          description: "Payment verification failed",
        },
      },
    });

    renderCallback("/payment/callback?reference=ref-failed");

    await waitFor(() => {
      expect(verifyPayment).toHaveBeenCalledWith(
        "ref-failed",
        { _skipAuthRedirect: true },
      );
    });

    expect(settleLocalPaymentForReference).not.toHaveBeenCalled();
  });
});

