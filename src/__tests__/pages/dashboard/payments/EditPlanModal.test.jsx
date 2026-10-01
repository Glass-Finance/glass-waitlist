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

// AudienceMemberPicker owns the members query (mounted only for a
// SELECTED_MEMBERS audience), so this is the seam it reads.
const MEMBERS = [
  { id: "member-a", firstName: "ada", lastName: "Obi", email: "ada@example.test" },
  { id: "member-b", firstName: "bayo", lastName: "Ade", email: "bayo@example.test" },
  { id: "member-c", firstName: "chioma", lastName: "Eze", email: "chioma@example.test" },
];
vi.mock("../../../../hooks/useCommunityMembers", () => ({
  useCommunityMembers: () => ({ members: MEMBERS, isLoading: false, error: null }),
}));

// AudienceGroupPicker owns the groups query the same way, so this is its seam.
const GROUPS = [
  { id: "group-a", name: "Board", status: "ACTIVE" },
  { id: "group-b", name: "Choir", status: "ACTIVE" },
];
const useCommunityGroupsMock = vi.fn(() => ({
  data: { content: GROUPS },
  isLoading: false,
  error: null,
}));
vi.mock("../../../../hooks/useGroups", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useCommunityGroups: (...args) => useCommunityGroupsMock(...args) };
});

afterEach(() => {
  cleanup();
  useCommunityGroupsMock.mockClear();
});

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
  amountMode: "FIXED",
  audience: "ALL_MEMBERS",
  visibility: "PUBLIC",
  memberIds: [],
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

// ── amountMode / visibility / audience ───────────────────────────────────────
// These three used to be absent from the PATCH payload entirely, which made
// them unchangeable after creation: the backend keeps the stored value for any
// field a PATCH omits, so an edit silently left the terms alone. They now
// round-trip — hydrate from the plan, and go back out on save.
function setSelect(testId, value) {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

function savedPayload(onSave) {
  return onSave.mock.calls[0][1];
}

describe("EditPlanModal — amountMode", () => {
  it("offers only FIXED for a recurring plan", () => {
    renderModal();
    expect([...screen.getByTestId("amount-mode").options].map((o) => o.value)).toEqual(["FIXED"]);
    expect(screen.getByText("Recurring plans always bill a fixed amount.")).toBeTruthy();
  });

  it("offers all four modes for a one-time plan", () => {
    renderModal({ planOverrides: { type: "ONE_TIME" } });
    expect([...screen.getByTestId("amount-mode").options].map((o) => o.value)).toEqual([
      "FIXED",
      "MINIMUM",
      "SUGGESTED",
      "VARIABLE",
    ]);
  });

  it("hydrates the stored amount mode", () => {
    renderModal({ planOverrides: { type: "ONE_TIME", amountMode: "SUGGESTED" } });
    expect(screen.getByTestId("amount-mode").value).toBe("SUGGESTED");
  });

  it("sends a changed amount mode", () => {
    const { onSave } = renderModal({ planOverrides: { type: "ONE_TIME" } });
    setSelect("amount-mode", "MINIMUM");

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({ amountMode: "MINIMUM", amount: 5000 });
  });

  it("clears the amount with an explicit 0 when a VARIABLE plan's figure is emptied", () => {
    // Not an omission: the PATCH handler substitutes the stored amount when
    // `amount` is absent, so clearing the field has to send 0 to take effect.
    const { onSave } = renderModal({
      planOverrides: { type: "ONE_TIME", amount: 5000, amountMode: "FIXED" },
    });
    setSelect("amount-mode", "VARIABLE");
    fireEvent.change(screen.getByPlaceholderText("₦0"), { target: { value: "" } });

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({ amountMode: "VARIABLE", amount: 0 });
  });

  it("keeps a stored figure as the VARIABLE baseline instead of wiping it on the switch", () => {
    const { onSave } = renderModal({ planOverrides: { type: "ONE_TIME" } });
    setSelect("amount-mode", "VARIABLE");

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({ amountMode: "VARIABLE", amount: 5000 });
  });

  it("hydrates a stored VARIABLE plan with no baseline as a blank, saveable amount", () => {
    // Regression: amount 0 is how the backend stores "no baseline". Hydrating
    // it as the string "0" looked like a typed zero, so validation rejected it
    // and Save stayed disabled on a valid plan.
    const { onSave } = renderModal({
      planOverrides: { type: "ONE_TIME", amountMode: "VARIABLE", amount: 0 },
    });
    expect(screen.getByPlaceholderText("₦0").value).toBe("");
    expect(saveButton().disabled).toBe(false);
    fireEvent.click(saveButton());
    expect(savedPayload(onSave)).toMatchObject({ amountMode: "VARIABLE", amount: 0 });
  });

  it("still blocks a save when a non-variable mode has no amount", () => {
    const { onSave } = renderModal({
      planOverrides: { type: "ONE_TIME", amountMode: "SUGGESTED" },
    });
    const amount = screen.getByPlaceholderText("₦0");
    fireEvent.change(amount, { target: { value: "" } });

    // Same shape as the pre-existing zero-amount case: Save is disabled and
    // the reason arrives on blur, since a disabled button can't be clicked.
    expect(saveButton().disabled).toBe(true);
    fireEvent.blur(amount);
    expect(screen.getByText("Amount is required.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("EditPlanModal — visibility", () => {
  it("hydrates and re-sends the stored visibility", () => {
    const { onSave } = renderModal({ planOverrides: { visibility: "MEMBERS_ONLY" } });
    expect(screen.getByTestId("visibility").value).toBe("MEMBERS_ONLY");

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({ visibility: "MEMBERS_ONLY" });
  });

  it("sends a changed visibility", () => {
    const { onSave } = renderModal();
    setSelect("visibility", "PRIVATE");

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({ visibility: "PRIVATE" });
  });
});

describe("EditPlanModal — selected members", () => {
  it("hydrates the stored member selection and re-sends those ids", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "SELECTED_MEMBERS", memberIds: ["member-a", "member-c"] },
    });
    expect(screen.getByLabelText("Ada Obi").checked).toBe(true);
    expect(screen.getByLabelText("Bayo Ade").checked).toBe(false);

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({
      audience: "SELECTED_MEMBERS",
      memberIds: ["member-a", "member-c"],
    });
  });

  it("adds and removes members from the saved payload", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "SELECTED_MEMBERS", memberIds: ["member-a"] },
    });

    fireEvent.click(screen.getByLabelText("Bayo Ade"));
    fireEvent.click(saveButton());
    expect(savedPayload(onSave)).toMatchObject({ memberIds: ["member-a", "member-b"] });

    cleanup();

    const { onSave: secondSave } = renderModal({
      planOverrides: { audience: "SELECTED_MEMBERS", memberIds: ["member-a", "member-b"] },
    });
    fireEvent.click(screen.getByLabelText("Ada Obi"));
    fireEvent.click(saveButton());
    expect(secondSave).toHaveBeenCalled();
    expect(secondSave.mock.calls[0][1]).toMatchObject({ memberIds: ["member-b"] });
  });

  it("blocks the save and explains when the last member is deselected", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "SELECTED_MEMBERS", memberIds: ["member-a"] },
    });

    fireEvent.click(screen.getByLabelText("Ada Obi"));

    expect(saveButton().disabled).toBe(true);
    expect(screen.getByText("Choose at least one member for this plan to bill.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("omits memberIds for an all-members plan", () => {
    const { onSave } = renderModal();

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).not.toHaveProperty("memberIds");
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

describe("EditPlanModal — GROUP audience", () => {
  it("hydrates the stored group selection and re-sends those ids", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "GROUP", groupIds: ["group-a", "group-b"] },
    });

    expect(screen.getByTestId("audience").value).toBe("GROUP");
    expect(screen.getByLabelText("Board").checked).toBe(true);
    expect(screen.getByLabelText("Choir").checked).toBe(true);

    fireEvent.click(saveButton());

    expect(savedPayload(onSave)).toMatchObject({
      audience: "GROUP",
      groupIds: ["group-a", "group-b"],
    });
  });

  it("can save a hydrated GROUP plan without re-picking anything", () => {
    // The regression this guards: without groupIds in shapePlan the modal opens
    // with an empty selection, Save is blocked by the empty-selection gate, and
    // the admin cannot edit their own plan.
    const { onSave } = renderModal({
      planOverrides: { audience: "GROUP", groupIds: ["group-a"] },
    });

    expect(saveButton().disabled).toBe(false);
    fireEvent.click(saveButton());
    expect(savedPayload(onSave)).toMatchObject({ groupIds: ["group-a"] });
  });

  it("blocks Save and explains when a GROUP plan has no groups", () => {
    const { onSave } = renderModal({ planOverrides: { audience: "GROUP", groupIds: [] } });

    expect(saveButton().disabled).toBe(true);
    expect(screen.getByText("Choose at least one group for this plan to bill.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("adds and removes groups from the saved payload", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "GROUP", groupIds: ["group-a"] },
    });

    fireEvent.click(screen.getByLabelText("Choir"));
    fireEvent.click(saveButton());
    expect(savedPayload(onSave)).toMatchObject({ groupIds: ["group-a", "group-b"] });

    cleanup();

    const { onSave: secondSave } = renderModal({
      planOverrides: { audience: "GROUP", groupIds: ["group-a", "group-b"] },
    });
    fireEvent.click(screen.getByLabelText("Board"));
    fireEvent.click(saveButton());
    expect(secondSave.mock.calls[0][1]).toMatchObject({ groupIds: ["group-b"] });
  });

  it("never sends memberIds for a GROUP plan", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "GROUP", groupIds: ["group-a"], memberIds: ["member-a"] },
    });

    fireEvent.click(saveButton());
    expect(savedPayload(onSave)).toMatchObject({ audience: "GROUP" });
    expect(savedPayload(onSave)).not.toHaveProperty("memberIds");
  });

  it("does not fetch the group list for a non-GROUP audience", () => {
    renderModal({ planOverrides: { audience: "SELECTED_MEMBERS", memberIds: ["member-a"] } });

    expect(screen.queryByText("Groups", { selector: "label" })).toBeNull();
    expect(useCommunityGroupsMock).not.toHaveBeenCalled();
  });

  it("clears a stale member selection when switching to GROUP", () => {
    renderModal({
      planOverrides: { audience: "SELECTED_MEMBERS", memberIds: ["member-a"] },
    });

    setSelect("audience", "GROUP");
    fireEvent.click(screen.getByLabelText("Board"));
    setSelect("audience", "SELECTED_MEMBERS");

    expect(screen.getByLabelText("Ada Obi").checked).toBe(false);
  });

  it("clears a stale group selection when switching to SELECTED_MEMBERS", () => {
    const { onSave } = renderModal({
      planOverrides: { audience: "GROUP", groupIds: ["group-a"] },
    });

    setSelect("audience", "SELECTED_MEMBERS");
    fireEvent.click(screen.getByLabelText("Ada Obi"));
    setSelect("audience", "GROUP");

    expect(screen.getByLabelText("Board").checked).toBe(false);

    // And the stale group list can't ride along in the payload. A member has to
    // be picked for the save to be valid at all — an empty SELECTED_MEMBERS
    // audience is blocked by the same gate a GROUP one is.
    setSelect("audience", "ALL_MEMBERS");
    setSelect("audience", "SELECTED_MEMBERS");
    fireEvent.click(screen.getByLabelText("Bayo Ade"));
    fireEvent.click(saveButton());
    expect(savedPayload(onSave)).not.toHaveProperty("groupIds");
  });
});
