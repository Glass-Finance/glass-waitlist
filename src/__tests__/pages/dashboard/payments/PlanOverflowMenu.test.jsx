import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import PlanOverflowMenu from "../../../../pages/dashboard/payments/PlanOverflowMenu";

afterEach(cleanup);

// planPlans only needs whichever mutation the rendered status path can
// reach -- these two (archive/expire) are what every status exercises here.
function makePlanPlans() {
  return {
    archive: { mutate: vi.fn(), isPending: false },
    expire: { mutate: vi.fn(), isPending: false },
    pause: { mutate: vi.fn(), isPending: false },
    resume: { mutate: vi.fn(), isPending: false },
    activate: { mutate: vi.fn(), isPending: false },
  };
}

function renderMenu(overrides = {}) {
  const plan = { id: "plan-1", name: "Monthly Dues", status: "ACTIVE", ...overrides };
  const planPlans = makePlanPlans();
  render(
    <PlanOverflowMenu
      plan={plan}
      planPlans={planPlans}
      onEdit={vi.fn()}
      onViewMembers={vi.fn()}
      onSendReminder={vi.fn()}
      onDuplicate={vi.fn()}
    />,
  );
  return { plan, planPlans };
}

function openMenu() {
  // The trigger is the only button rendered before the menu opens.
  fireEvent.click(screen.getByRole("button"));
}

describe("PlanOverflowMenu — Archive", () => {
  it("does not archive immediately -- clicking Archive only opens a confirmation", () => {
    const { planPlans } = renderMenu();
    openMenu();

    fireEvent.click(screen.getByText("Archive"));

    expect(planPlans.archive.mutate).not.toHaveBeenCalled();
    expect(screen.getByText("Archive Plan")).toBeTruthy();
    expect(screen.getByText(/stops any further collection/i)).toBeTruthy();
  });

  it("archives the plan only after the confirmation dialog is confirmed", () => {
    const { plan, planPlans } = renderMenu();
    openMenu();
    fireEvent.click(screen.getByText("Archive"));

    // Two "Archive"-labelled controls exist now: the confirm dialog's
    // button is the last one rendered.
    const archiveButtons = screen.getAllByText("Archive");
    fireEvent.click(archiveButtons[archiveButtons.length - 1]);

    expect(planPlans.archive.mutate).toHaveBeenCalledTimes(1);
    expect(planPlans.archive.mutate).toHaveBeenCalledWith(
      plan.id,
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("backing out of the confirmation via Cancel never archives", () => {
    const { planPlans } = renderMenu();
    openMenu();
    fireEvent.click(screen.getByText("Archive"));

    fireEvent.click(screen.getByText("Cancel"));

    expect(planPlans.archive.mutate).not.toHaveBeenCalled();
    expect(screen.queryByText("Archive Plan")).toBeNull();
  });

  it("is not offered once a plan is already archived", () => {
    renderMenu({ status: "ARCHIVED" });
    openMenu();

    expect(screen.queryByText("Archive")).toBeNull();
  });
});

describe("PlanOverflowMenu — End Plan", () => {
  it("requires confirmation before expiring an active plan", () => {
    const { planPlans } = renderMenu();
    openMenu();

    fireEvent.click(screen.getByRole("button", { name: "End Plan" }));
    expect(planPlans.expire.mutate).not.toHaveBeenCalled();

    // The dialog's title ("End Plan", an <h2>) and its confirm button share
    // the same text, so disambiguate by role rather than text alone.
    fireEvent.click(screen.getByRole("button", { name: "End Plan" }));
    expect(planPlans.expire.mutate).toHaveBeenCalledTimes(1);
  });
});
