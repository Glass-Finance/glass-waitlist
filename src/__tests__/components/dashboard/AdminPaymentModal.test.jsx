import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminPaymentModal } from "../../../components/dashboard/AdminPaymentModal";
import {
  useManagePayments,
  useInitiatePayment,
  findAuthorisationForPlan,
} from "../../../hooks/usePayments";

// Regression: this modal used to call the real charge endpoint automatically
// as soon as it opened (to preview the fee), then call it *again* with a
// different random idempotency key when the admin clicked "Make Payment" --
// for a member with a saved/authorised method that could charge them twice
// (see AUDIT_REPORT.md, F01/F02). These tests pin the fix: no charge until
// the button is clicked, and one stable idempotency key per attempt.

vi.mock("../../../hooks/usePayments", () => ({
  useManagePayments: vi.fn(),
  useInitiatePayment: vi.fn(),
  recordLocalPayment: vi.fn(),
  stashPendingPaymentCtx: vi.fn(),
  findAuthorisationForPlan: vi.fn(),
}));

function item(overrides = {}) {
  return {
    paymentLinkId: "link-1",
    obligationId: "ob-1",
    name: "Monthly Dues",
    communityName: "Kings College Alumni",
    amount: 5000,
    type: "one-time",
    ...overrides,
  };
}

function renderModal(props = {}) {
  return render(
    <MemoryRouter>
      <AdminPaymentModal item={item()} onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

let mutateAsync;

beforeEach(() => {
  useManagePayments.mockReturnValue({ data: [] });
  findAuthorisationForPlan.mockReturnValue(null);
  mutateAsync = vi.fn().mockResolvedValue({
    data: { data: { authorizationUrl: "https://paystack.example/pay", reference: "ref-1" } },
  });
  useInitiatePayment.mockReturnValue({ mutateAsync, isPending: false });
});

describe("AdminPaymentModal charge timing", () => {
  it("does not call initiatePayment just from opening the modal", async () => {
    renderModal();

    await waitFor(() => expect(screen.getByText("Make Payment")).toBeDefined());

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("calls initiatePayment exactly once, only after Make Payment is clicked", async () => {
    renderModal();

    (await screen.findByText("Make Payment")).click();

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentLinkId: "link-1",
        payload: expect.objectContaining({ amount: 5000 }),
      }),
    );
  });

  it("reuses the same idempotency key after a failed attempt is retried on the same mount", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("network error"));
    renderModal();

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
