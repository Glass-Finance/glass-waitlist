import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DuplicatePlanModal from "../../../../pages/dashboard/payments/DuplicatePlanModal";

// Duplicate fires immediately from the ⋯ menu (no confirm step), so this
// modal's gate — slug availability + required dates — is the only thing
// standing between an accidental double-click and a duplicated plan.

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

afterEach(cleanup);

const recurringPlan = {
  id: "plan-1",
  name: "Monthly Dues",
  type: "RECURRING",
  frequency: "MONTHLY",
  recurringPlan: {
    interval: 2,
    billingDay: 5,
    endAt: "2026-12-30T12:00:00.000Z",
    retryPolicy: "EVERY_24H",
    graceDays: 3,
  },
};

const oneTimePlan = { id: "plan-2", name: "Event Fee", type: "ONE_TIME" };

function renderModal({ thePlan = recurringPlan, ...props } = {}) {
  const all = {
    plan: thePlan,
    onClose: vi.fn(),
    onDuplicate: vi.fn(),
    duplicating: false,
    ...props,
  };
  const view = render(<DuplicatePlanModal {...all} />);
  return { ...all, ...view };
}

function duplicateButton() {
  return screen.getByRole("button", { name: /^(Duplicate Plan|Duplicating…)$/ });
}

function fillSlug(value = "dues-copy") {
  fireEvent.change(screen.getByPlaceholderText("e.g. alumni-dues-2026"), {
    target: { value },
  });
}

describe("DuplicatePlanModal — gating", () => {
  it("keeps Duplicate disabled until a slug is entered", () => {
    renderModal();
    expect(screen.getByPlaceholderText("Plan name").value).toBe("Monthly Dues (Copy)");
    expect(duplicateButton().disabled).toBe(true);

    fillSlug();

    expect(duplicateButton().disabled).toBe(false);
  });

  it("blocks Duplicate when the slug is taken", () => {
    const { onDuplicate } = renderModal();
    fillSlug("taken");

    expect(duplicateButton().disabled).toBe(true);
    expect(screen.getByText("That URL is taken — try another.")).toBeTruthy();
    expect(onDuplicate).not.toHaveBeenCalled();
  });

  it("requires a due date before duplicating a one-time plan", () => {
    renderModal({ thePlan: oneTimePlan });
    fillSlug();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(duplicateButton().disabled).toBe(true);

    // Start Date and Due Date are the only date inputs for one-time plans.
    fireEvent.change(dateInputs[dateInputs.length - 1], { target: { value: "2026-12-31" } });

    expect(duplicateButton().disabled).toBe(false);
  });
});

describe("DuplicatePlanModal — payload contract", () => {
  it("carries over the recurring schedule for a recurring plan", () => {
    const { onDuplicate } = renderModal();
    fillSlug();

    fireEvent.click(duplicateButton());

    expect(onDuplicate).toHaveBeenCalledTimes(1);
    const [id, payload] = onDuplicate.mock.calls[0];
    expect(id).toBe("plan-1");
    expect(payload).toMatchObject({
      title: "Monthly Dues (Copy)",
      slug: "dues-copy",
      startAt: expect.any(String),
    });
    expect(payload.recurringPlan).toMatchObject({
      frequency: "MONTHLY",
      interval: 2,
      startAt: expect.any(String),
      billingDay: 5,
      endAt: "2026-12-30T12:00:00.000Z",
      retryPolicy: "EVERY_24H",
      graceDays: 3,
    });
    expect(payload).not.toHaveProperty("dueAt");
  });

  it("sends dueAt with no recurringPlan for a one-time plan", () => {
    const { onDuplicate } = renderModal({ thePlan: oneTimePlan });
    fillSlug();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[dateInputs.length - 1], { target: { value: "2026-12-31" } });

    fireEvent.click(duplicateButton());

    const payload = onDuplicate.mock.calls[0][1];
    expect(payload.dueAt).toEqual(expect.any(String));
    expect(payload.recurringPlan).toBeUndefined();
    expect(payload.title).toBe("Event Fee (Copy)");
  });
});

describe("DuplicatePlanModal — pending & dismissal", () => {
  it("shows Duplicating… and disables the button while a duplicate is in flight", () => {
    const props = {
      plan: recurringPlan,
      onClose: vi.fn(),
      onDuplicate: vi.fn(),
      duplicating: false,
    };
    const view = render(<DuplicatePlanModal {...props} />);
    fillSlug();
    expect(duplicateButton().disabled).toBe(false);

    view.rerender(<DuplicatePlanModal {...props} duplicating />);

    const button = duplicateButton();
    expect(button.textContent).toContain("Duplicating…");
    expect(button.disabled).toBe(true);
  });

  it("dismisses via the backdrop without duplicating", () => {
    const { container, onClose, onDuplicate } = renderModal();

    fireEvent.click(container.firstElementChild);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDuplicate).not.toHaveBeenCalled();
  });
});
