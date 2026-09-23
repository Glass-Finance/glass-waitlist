import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EditPlanModal from "../../../../pages/dashboard/payments/EditPlanModal";

// EditPlanModal builds a PATCH payload whose contract has three easy-to-break
// rules: root-level reminderFrequency/reminderChannels, explicit
// reminderFrequency:"DISABLED" when reminders are off, and clearEndAt:true
// (with endAt omitted) when a previously-set end date is cleared — omitting
// endAt alone silently leaves the old value in place server-side.

vi.mock("../../../../hooks/useCommunityAccount", () => ({
  useCommunityAccount: () => ({ accounts: [], account: null, isLoading: false }),
}));

afterEach(cleanup);

const plan = {
  id: "plan-1",
  name: "Monthly Dues",
  amount: 5000,
  type: "RECURRING",
  frequency: "MONTHLY",
  startAt: "2026-01-01T10:00:00.000Z",
  endAt: "2026-06-30T23:00:00.000Z",
  recurringPlan: { interval: 1, billingDay: 5, retryPolicy: "EVERY_24H", graceDays: 3 },
  reminderFrequency: "WEEKLY",
  reminderChannels: ["IN_APP"],
  communityAccountId: "",
};

function renderModal({ planOverrides = {}, ...props } = {}) {
  const all = {
    plan: { ...plan, ...planOverrides },
    communityId: "comm-1",
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    saving: false,
    ...props,
  };
  const view = render(<EditPlanModal {...all} />);
  return { ...all, ...view };
}

function saveButton() {
  return screen.getByRole("button", { name: /^(Save Changes|Saving…)$/ });
}

// For a MONTHLY plan the only two date inputs are Start Date and End Date.
function endDateInput(container) {
  return container.querySelectorAll('input[type="date"]')[1];
}

describe("EditPlanModal — prefill & gating", () => {
  it("prefills name/amount and disables Save when the name is emptied", () => {
    renderModal();
    expect(screen.getByPlaceholderText("Plan name").value).toBe("Monthly Dues");
    expect(screen.getByPlaceholderText("₦0").value).toBe("5000");

    fireEvent.change(screen.getByPlaceholderText("Plan name"), { target: { value: "" } });

    expect(saveButton().disabled).toBe(true);
  });

  it("rejects a whitespace-only name with an inline error instead of saving", () => {
    const { onSave } = renderModal();
    fireEvent.change(screen.getByPlaceholderText("Plan name"), { target: { value: "   " } });
    const save = saveButton();
    expect(save.disabled).toBe(false);

    fireEvent.click(save);

    expect(screen.getByText("Plan name is required.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("blocks Save for a zero amount and shows the amount error on blur", () => {
    const { onSave } = renderModal();
    const amount = screen.getByPlaceholderText("₦0");
    fireEvent.change(amount, { target: { value: "0" } });

    expect(saveButton().disabled).toBe(true);

    fireEvent.blur(amount);

    expect(screen.getByText("Enter an amount greater than 0.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("EditPlanModal — payload contract", () => {
  it("saves the recurring-plan PATCH contract unchanged", async () => {
    const { onSave } = renderModal();
    fireEvent.change(screen.getByPlaceholderText("Plan name"), {
      target: { value: "Updated Dues" },
    });

    fireEvent.click(saveButton());

    expect(onSave).toHaveBeenCalledTimes(1);
    const [id, payload] = onSave.mock.calls[0];
    expect(id).toBe("plan-1");
    expect(payload).toMatchObject({
      title: "Updated Dues",
      amount: 5000,
      startAt: expect.any(String),
      reminderFrequency: "WEEKLY",
      reminderChannels: ["IN_APP"],
    });
    expect(payload.recurringPlan).toMatchObject({
      frequency: "MONTHLY",
      interval: 1,
      billingDay: 5,
      endAt: expect.any(String),
      retryPolicy: "EVERY_24H",
      graceDays: 3,
    });
    expect(payload.recurringPlan).not.toHaveProperty("clearEndAt");
    expect(payload.communityAccountId).toBeUndefined();
  });

  it("warns and sends clearEndAt (no endAt) when the end date is cleared", () => {
    const { container, onSave } = renderModal();

    fireEvent.change(endDateInput(container), { target: { value: "" } });

    expect(screen.getByText("This will remove the existing end date.")).toBeTruthy();

    fireEvent.click(saveButton());

    const payload = onSave.mock.calls[0][1];
    expect(payload.recurringPlan).toHaveProperty("clearEndAt", true);
    expect(payload.recurringPlan).not.toHaveProperty("endAt");
  });

  it("saves reminderFrequency DISABLED when the reminder toggle is off", () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByLabelText("Send automatic reminders to unpaid members"));

    fireEvent.click(saveButton());

    const payload = onSave.mock.calls[0][1];
    expect(payload.reminderFrequency).toBe("DISABLED");
    expect(payload.reminderChannels).toBeUndefined();
  });

  it("warns and saves DISABLED when every reminder channel is unchecked", () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByLabelText("In-app notification"));

    expect(
      screen.getByText("Choose at least one channel, or reminders will be saved disabled."),
    ).toBeTruthy();

    fireEvent.click(saveButton());

    const payload = onSave.mock.calls[0][1];
    expect(payload.reminderFrequency).toBe("DISABLED");
    expect(payload.reminderChannels).toBeUndefined();
  });
});

describe("EditPlanModal — pending & dismissal", () => {
  it("shows Saving… and disables the button while a save is in flight", () => {
    renderModal({ saving: true });
    const save = saveButton();
    expect(save.textContent).toContain("Saving…");
    expect(save.disabled).toBe(true);
  });

  it("dismisses via the backdrop without saving", () => {
    const { container, onClose, onSave } = renderModal();

    fireEvent.click(container.firstElementChild);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
