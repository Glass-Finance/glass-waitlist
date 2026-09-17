import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentSummary from "../../../pages/memberApp/PaymentSummary";
import { getObligation } from "../../../api/members";
import { useInitiatePayment, useManagePayments } from "../../../hooks/usePayments";

// ADR-004 documents that the frontend generates a UUID idempotencyKey but
// notes backend enforcement isn't verified in this repo -- that half is
// blocked pending backend coordination. What IS fully verifiable from the
// frontend alone, and wasn't tested before this file: does the frontend
// actually hold up its own end of the contract? Specifically, PaymentSummary's
// own code comment states the intent directly: "reused across a retry after
// a failed attempt so the backend treats them as the same intent, not a
// second charge." These tests pin that a retry within one mounted attempt
// reuses the same key, and a genuinely fresh attempt (a new mount) gets a
// new one -- not "always the same" and not "a new one every click," either
// of which would defeat the point.

vi.mock("../../../api/members", async () => {
  const actual = await vi.importActual("../../../api/members");
  return { ...actual, getObligation: vi.fn() };
});
vi.mock("../../../hooks/usePayments", async () => {
  const actual = await vi.importActual("../../../hooks/usePayments");
  return { ...actual, useInitiatePayment: vi.fn(), useManagePayments: vi.fn() };
});

function obligation(overrides = {}) {
  return {
    id: "obl-1",
    amount: 500000,
    community: { name: "Kings College Alumni" },
    paymentLink: { id: "link-1", title: "Termly Dues" },
    recurringPlan: null,
    ...overrides,
  };
}

let mutateAsync;
let originalLocation;

beforeEach(() => {
  getObligation.mockResolvedValue({ data: { data: obligation() } });
  useManagePayments.mockReturnValue({ data: [] });
  mutateAsync = vi
    .fn()
    .mockRejectedValue({ response: { data: { description: "Payment failed" } } });
  useInitiatePayment.mockReturnValue({ mutateAsync, isPending: false });

  originalLocation = window.location;
  delete window.location;
  window.location = { ...originalLocation, href: "" };
});

afterEach(() => {
  window.location = originalLocation;
  cleanup();
});

function renderPaymentSummary() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/member/pay/obl-1"]}>
        <Routes>
          <Route path="/member/pay/:paymentId" element={<PaymentSummary />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PaymentSummary idempotency key", () => {
  it("reuses the exact same idempotencyKey across a retry after a failed attempt", async () => {
    renderPaymentSummary();

    const payButton = await screen.findByText("Make Payment");
    payButton.click();
    await screen.findByText("Payment failed");

    const firstKey = mutateAsync.mock.calls[0][0].payload.idempotencyKey;
    expect(firstKey).toBeTruthy();

    // Retry after the failure.
    screen.getByText("Make Payment").click();
    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
    await screen.findAllByText("Payment failed");

    const secondKey = mutateAsync.mock.calls[1][0].payload.idempotencyKey;
    expect(secondKey).toBe(firstKey);
  });

  it("generates a genuinely different idempotencyKey for a fresh mount (a new, separate payment attempt)", async () => {
    renderPaymentSummary();
    let payButton = await screen.findByText("Make Payment");
    payButton.click();
    await screen.findByText("Payment failed");
    const firstAttemptKey = mutateAsync.mock.calls[0][0].payload.idempotencyKey;

    cleanup(); // simulates navigating away and back -- a real new attempt, not a re-render

    renderPaymentSummary();
    payButton = await screen.findByText("Make Payment");
    payButton.click();
    await screen.findByText("Payment failed");
    const secondAttemptKey = mutateAsync.mock.calls[1][0].payload.idempotencyKey;

    expect(secondAttemptKey).not.toBe(firstAttemptKey);
  });
});
