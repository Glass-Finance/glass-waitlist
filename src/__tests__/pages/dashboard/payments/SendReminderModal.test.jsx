import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SendReminderModal from "../../../../pages/dashboard/payments/SendReminderModal";

// The one-off reminder blast: fires from the ⋯ menu with no confirm step,
// so the channel-selection gate and the exact payload are the contracts
// worth pinning here.

afterEach(cleanup);

const plan = { id: "plan-1", name: "monthly dues" };

function renderModal(props = {}) {
  const all = {
    plan,
    onClose: vi.fn(),
    onSend: vi.fn(),
    sending: false,
    ...props,
  };
  const view = render(<SendReminderModal {...all} />);
  return { ...all, ...view };
}

function sendButton() {
  return screen.getByRole("button", { name: /^(Send Reminder|Sending…)$/ });
}

describe("SendReminderModal — send", () => {
  it("sends the default schedule (every 3 days, in-app)", () => {
    const { onSend } = renderModal();

    fireEvent.click(sendButton());

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith({
      reminderFrequency: "EVERY_3_DAYS",
      reminderChannels: ["IN_APP"],
    });
  });

  it("warns and blocks send when every channel is unchecked", () => {
    const { onSend } = renderModal();
    fireEvent.click(screen.getByLabelText("In-app notification"));

    expect(screen.getByText("Choose at least one channel.")).toBeTruthy();
    expect(sendButton().disabled).toBe(true);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends the chosen frequency and channels", () => {
    const { onSend } = renderModal();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "MONTHLY" } });
    fireEvent.click(screen.getByLabelText("Email"));
    fireEvent.click(screen.getByLabelText("In-app notification"));

    fireEvent.click(sendButton());

    expect(onSend).toHaveBeenCalledWith({
      reminderFrequency: "MONTHLY",
      reminderChannels: ["EMAIL"],
    });
  });
});

describe("SendReminderModal — pending & dismissal", () => {
  it("shows Sending… and disables the button while a send is in flight", () => {
    renderModal({ sending: true });
    const button = sendButton();
    expect(button.textContent).toContain("Sending…");
    expect(button.disabled).toBe(true);
  });

  it("Cancel closes without sending", () => {
    const { onClose, onSend } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });
});
