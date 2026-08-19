import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentSummary from "../../../pages/memberApp/PaymentSummary";
import { getObligation } from "../../../api/members";
import {
  useManagePayments,
  useInitiatePayment,
  findAuthorisationForPlan,
} from "../../../hooks/usePayments";

// Regression: this screen used to call the real charge endpoint
// (initiatePayment) automatically as soon as the obligation loaded, before
// the member ever pressed "Make Payment" -- for a payer with an existing
// saved/authorised method that charged them with no confirmation at all
// (see AUDIT_REPORT.md, F01). These tests pin the fix: no charge until the
// button is explicitly clicked, exactly once per click.

vi.mock("../../../api/members", () => ({
  getObligation: vi.fn(),
  getPaymentLink: vi.fn(),
}));

vi.mock("../../../hooks/usePayments", () => ({
  useManagePayments: vi.fn(),
  useInitiatePayment: vi.fn(),
  recordLocalPayment: vi.fn(),
  recordLocalFee: vi.fn(),
  stashPendingPaymentCtx: vi.fn(),
  findAuthorisationForPlan: vi.fn(),
}));

function obligation(overrides = {}) {
  return {
    id: "ob-1",
    amount: 5000,
    community: { name: "Kings College Alumni" },
    recurringPlan: null,
    paymentLink: { id: "link-1", title: "Monthly Dues" },
    ...overrides,
  };
}

function renderPaymentSummary() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/member/pay/ob-1"]}>
        <Routes>
          <Route path="/member/pay/:paymentId" element={<PaymentSummary />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

let mutateAsync;

beforeEach(() => {
  getObligation.mockResolvedValue({ data: { data: obligation() } });
  useManagePayments.mockReturnValue({ data: [] });
  findAuthorisationForPlan.mockReturnValue(null);
  mutateAsync = vi.fn().mockResolvedValue({
    data: { data: { authorizationUrl: "https://paystack.example/pay", reference: "ref-1" } },
  });
  useInitiatePayment.mockReturnValue({ mutateAsync, isPending: false });
});

describe("PaymentSummary charge timing", () => {
  it("does not call initiatePayment while the page is just loading/displaying", async () => {
    renderPaymentSummary();

    await waitFor(() => expect(screen.getByText("Make Payment")).toBeDefined());

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("calls initiatePayment exactly once, only after Make Payment is clicked", async () => {
    renderPaymentSummary();

    const button = await screen.findByText("Make Payment");
    button.click();

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentLinkId: "link-1",
        payload: expect.objectContaining({ amount: 5000 }),
      }),
    );
  });

  it("reuses the same idempotency key after a failed attempt is retried on the same mount", async () => {
    // A successful redirect navigates the page away for real, so the only
    // same-mount retry that actually happens is after a failure -- the
    // catch branch leaves the button enabled and the component mounted.
    mutateAsync.mockRejectedValueOnce(new Error("network error"));
    renderPaymentSummary();

    (await screen.findByText("Make Payment")).click();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));

    const firstKey = mutateAsync.mock.calls[0][0].payload.idempotencyKey;
    expect(firstKey).toBeTruthy();

    (await screen.findByText("Make Payment")).click();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));

    const secondKey = mutateAsync.mock.calls[1][0].payload.idempotencyKey;
    expect(secondKey).toBe(firstKey);
  });
});
