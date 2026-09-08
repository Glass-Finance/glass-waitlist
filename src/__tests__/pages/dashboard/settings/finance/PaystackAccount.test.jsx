import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PaystackAccount from "../../../../../pages/dashboard/settings/finance/PaystackAccount";
import { useActiveCommunityId } from "../../../../../hooks/useActiveCommunityId";
import { useCommunityAccount } from "../../../../../hooks/useCommunityAccount";
import { useCommunity } from "../../../../../hooks/useCommunity";

// Payout account removal is Tier 1 in the test-coverage scoping plan: it's
// irreversible (the community stops being able to receive settlements until
// a new account is added) and directly money-adjacent. These tests pin two
// things specifically: (1) removal genuinely requires the explicit confirm
// step -- the trash icon alone must never fire the delete call -- and
// (2) a failed removal surfaces a real, visible error rather than failing
// silently, exercising the getErrorMessage integration fixed elsewhere this
// session.

vi.mock("../../../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: vi.fn(),
}));
vi.mock("../../../../../hooks/useCommunityAccount", () => ({
  useCommunityAccount: vi.fn(),
}));
vi.mock("../../../../../hooks/useCommunity", () => ({
  useCommunity: vi.fn(),
}));

function account(overrides = {}) {
  return {
    id: "acct-1",
    accountName: "Kings College Alumni",
    accountNumber: "0123456789",
    settlementBank: "Zenith Bank",
    settlementBankCode: "057",
    status: "ACTIVE",
    ...overrides,
  };
}

let removeMutateAsync;

beforeEach(() => {
  useActiveCommunityId.mockReturnValue("comm-1");
  useCommunity.mockReturnValue({ data: { name: "Kings College Alumni" } });

  removeMutateAsync = vi.fn().mockResolvedValue({});
  useCommunityAccount.mockReturnValue({
    account: account(),
    isLoading: false,
    create: { mutateAsync: vi.fn(), isPending: false },
    update: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: removeMutateAsync, isPending: false },
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PaystackAccount />
    </MemoryRouter>,
  );
}

describe("PaystackAccount removal flow", () => {
  it("does not call remove.mutateAsync just from clicking the trash icon", async () => {
    renderPage();

    (await screen.findByTitle("Remove payout account")).click();

    // The confirm dialog should now be open, but nothing should have fired yet.
    await screen.findByText("Remove payout account?");
    expect(removeMutateAsync).not.toHaveBeenCalled();
  });

  it("calls remove.mutateAsync with the account id only after the confirm button is clicked", async () => {
    renderPage();

    (await screen.findByTitle("Remove payout account")).click();
    (await screen.findByText("Remove Account")).click();

    await waitFor(() => expect(removeMutateAsync).toHaveBeenCalledTimes(1));
    expect(removeMutateAsync).toHaveBeenCalledWith("acct-1");
  });

  it("clicking Cancel in the confirm dialog never calls remove.mutateAsync", async () => {
    renderPage();

    (await screen.findByTitle("Remove payout account")).click();
    (await screen.findByText("Cancel")).click();

    await waitFor(() => expect(screen.queryByText("Remove payout account?")).toBeNull());
    expect(removeMutateAsync).not.toHaveBeenCalled();
  });

  it("shows the server's specific error message when removal fails, not a silent failure", async () => {
    removeMutateAsync.mockRejectedValueOnce({
      response: { data: { description: "This account has a pending settlement and cannot be removed." } },
    });
    renderPage();

    (await screen.findByTitle("Remove payout account")).click();
    (await screen.findByText("Remove Account")).click();

    await screen.findByText("This account has a pending settlement and cannot be removed.");
  });

  it("falls back to a generic message when the server gives no usable error detail", async () => {
    // No .response, no .request, no .message -- the one shape that actually
    // reaches getErrorMessage's final fallback rather than surfacing
    // something more specific (a plain `new Error("...")` would surface its
    // own .message instead, so that's not a useful case to test here).
    removeMutateAsync.mockRejectedValueOnce({});
    renderPage();

    (await screen.findByTitle("Remove payout account")).click();
    (await screen.findByText("Remove Account")).click();

    await screen.findByText("Couldn't remove the account. Please try again.");
  });

  it("shows the Add Payout Account prompt, not a remove option, when there is no account yet", async () => {
    useCommunityAccount.mockReturnValue({
      account: null,
      isLoading: false,
      create: { mutateAsync: vi.fn(), isPending: false },
      update: { mutateAsync: vi.fn(), isPending: false },
      remove: { mutateAsync: vi.fn(), isPending: false },
    });
    renderPage();

    await screen.findByText("No Payout Account Set Up");
    expect(screen.queryByTitle("Remove payout account")).toBeNull();
  });
});
