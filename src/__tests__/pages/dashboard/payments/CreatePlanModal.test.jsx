import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CreatePlanModal from "../../../../pages/dashboard/payments/CreatePlanModal";

// CreatePlanModal is the first (and only) entry point for creating a payment
// plan -- it builds the entire create payload in handleSubmit. These tests pin
// the navigation (wizard steps), client-side validation gate, and the exact
// payload shape for recurring vs one-time plans so a contract regression here
// can't ship silently.

vi.mock("../../../../hooks/useSlug", async () => {
  const { useState } = await vi.importActual("react");
  return {
    useSlug: () => {
      const [slug, setSlug] = useState("");
      return {
        slug,
        setSlug,
        available: slug === "" ? null : slug === "taken" ? false : true,
        checking: false,
        suggesting: false,
        suggestFrom: () => {},
      };
    },
  };
});

vi.mock("../../../../hooks/useCommunityAccount", () => ({
  useCommunityAccount: () => ({ accounts: [], account: null, isLoading: false }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderModal(overrides = {}) {
  const props = {
    communityId: "comm-1",
    onClose: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(true),
    creating: false,
    createError: null,
    ...overrides,
  };
  render(<CreatePlanModal {...props} />);
  return props;
}

function goToDetails() {
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

function fillRecurringDetails({
  name = "Monthly Dues",
  amount = "5000",
  slug = "monthly-dues",
} = {}) {
  fireEvent.change(screen.getByPlaceholderText("Enter plan name"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByPlaceholderText("₦0.00"), { target: { value: amount } });
  fireEvent.change(screen.getByDisplayValue("Select frequency"), {
    target: { value: "MONTHLY" },
  });
  fireEvent.change(screen.getByPlaceholderText("e.g. alumni-dues-2026"), {
    target: { value: slug },
  });
}

// The footer's left button reads "Cancel" only at step 1 — from step 2 on
// it reads "Back" — and the primary action sits next to it in the same row.
function footerButton(label) {
  const anchor = screen.getByRole("button", { name: /^(Cancel|Back)$/ });
  return [...anchor.parentElement.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === label,
  );
}

function submitStepTwo() {
  fireEvent.click(footerButton("Continue"));
}

function submitCreate() {
  const create = footerButton("Create Plan");
  fireEvent.click(create);
  return create;
}

describe("CreatePlanModal — navigation", () => {
  it("advances from plan type to plan details", () => {
    renderModal();
    expect(screen.getByText("Choose the type of plan you want to create")).toBeTruthy();

    goToDetails();

    expect(screen.getByPlaceholderText("Enter plan name")).toBeTruthy();
    expect(screen.getByPlaceholderText("₦0.00")).toBeTruthy();
  });

  it("Cancel at step 1 closes without creating", () => {
    const { onClose, onCreate } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("Back at step 2 returns to step 1 instead of closing", () => {
    const { onClose } = renderModal();
    goToDetails();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText("Choose the type of plan you want to create")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CreatePlanModal — validation", () => {
  it("rejects a whitespace-only plan name and stays on the details step", () => {
    const { onCreate } = renderModal();
    goToDetails();
    fillRecurringDetails({ name: "   " });

    submitStepTwo();

    expect(screen.getByText("Plan name is required.")).toBeTruthy();
    // Still on step 2 — the details inputs remain visible.
    expect(screen.getByPlaceholderText("Enter plan name")).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("blocks Continue when the amount is zero and shows the field error on blur", () => {
    const { onCreate } = renderModal();
    goToDetails();
    fillRecurringDetails({ amount: "0" });

    expect(footerButton("Continue").disabled).toBe(true);

    fireEvent.blur(screen.getByPlaceholderText("₦0.00"));

    expect(screen.getByText("Enter an amount greater than 0.")).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("blocks Continue when the suggested slug is already taken", () => {
    const { onCreate } = renderModal();
    goToDetails();
    fillRecurringDetails({ slug: "taken" });

    expect(footerButton("Continue").disabled).toBe(true);
    expect(screen.getByText("That URL is taken — try another.")).toBeTruthy();
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe("CreatePlanModal — payload", () => {
  it("submits the recurring-plan contract and flashes success", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { onCreate, onClose } = renderModal();
    goToDetails();
    fillRecurringDetails();
    submitStepTwo();

    submitCreate();

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload = onCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: "Monthly Dues",
      amount: 5000,
      paymentType: "RECURRING",
      slug: "monthly-dues",
      audience: "ALL_MEMBERS",
      visibility: "PUBLIC",
      amountMode: "FIXED",
      activateImmediately: true,
      reminderFrequency: "EVERY_3_DAYS",
      reminderChannels: ["IN_APP"],
    });
    expect(payload.recurringPlan).toMatchObject({
      frequency: "MONTHLY",
      interval: 1,
      retryPolicy: "NO_RETRY",
      graceDays: 0,
    });
    expect(payload.recurringPlan.startAt).toEqual(expect.any(String));
    expect(payload.description).toBeUndefined();
    expect(payload.communityAccountId).toBeUndefined();

    // Success stage (onCreate resolved true).
    expect(await screen.findByText("Plan Created!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });

  it("submits the one-time contract with dueAt and no recurringPlan", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { onCreate } = renderModal();
    // Choose the one-time plan type on step 1 before advancing.
    fireEvent.click(screen.getByText("One Time"));
    goToDetails();
    fireEvent.change(screen.getByPlaceholderText("Enter plan name"), {
      target: { value: "Event Fee" },
    });
    fireEvent.change(screen.getByPlaceholderText("₦0.00"), { target: { value: "2000" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. alumni-dues-2026"), {
      target: { value: "event-fee" },
    });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[dateInputs.length - 1], {
      target: { value: "2026-12-31" },
    });

    submitStepTwo();
    const create = submitCreate();

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload = onCreate.mock.calls[0][0];
    expect(payload.paymentType).toBe("ONE_TIME");
    expect(payload.dueAt).toEqual(expect.any(String));
    expect(payload.recurringPlan).toBeUndefined();
    expect(payload.startAt).toBeUndefined();
    expect(payload.reminderFrequency).toBe("EVERY_3_DAYS");
    expect(payload.reminderChannels).toEqual(["IN_APP"]);
    expect(create).toBeTruthy();

    expect(await screen.findByText("Plan Created!")).toBeTruthy();
  });

  it("saves reminders as DISABLED when the reminder toggle is off", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { onCreate } = renderModal();
    goToDetails();
    fillRecurringDetails();
    fireEvent.click(screen.getByLabelText("Send automatic reminders to unpaid members"));
    submitStepTwo();

    submitCreate();

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload = onCreate.mock.calls[0][0];
    expect(payload.reminderFrequency).toBe("DISABLED");
    expect(payload.reminderChannels).toBeUndefined();
    expect(await screen.findByText("Plan Created!")).toBeTruthy();
  });
});

describe("CreatePlanModal — pending & error", () => {
  it("disables Create Plan and shows Creating… while a create is in flight", () => {
    const props = {
      communityId: "comm-1",
      onClose: vi.fn(),
      onCreate: vi.fn(),
      creating: false,
      createError: null,
    };
    const view = render(<CreatePlanModal {...props} />);
    goToDetails();
    fillRecurringDetails();
    submitStepTwo();

    // The parent flips `creating` once the mutation is dispatched.
    view.rerender(<CreatePlanModal {...props} creating />);

    const create = footerButton("Creating…");
    expect(create).toBeTruthy();
    expect(create.disabled).toBe(true);
  });

  it("surfaces the create error from the parent", () => {
    renderModal({ createError: "Something went wrong creating the plan." });
    expect(screen.getByText("Something went wrong creating the plan.")).toBeTruthy();
  });
});
