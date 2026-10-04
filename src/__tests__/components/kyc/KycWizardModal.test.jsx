import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import KycWizardModal from "../../../components/kyc/KycWizardModal";

// The wizard runs on useKycVerification's state machine — mocked at the
// hook boundary (repo convention: mock API/hooks, never hit prod
// services). mockKyc is mutable so each test seeds a server status.
//
// The flow is now three steps (the overview step became the Glass Pass
// rail), so a fresh account lands straight on the ID choice. Assertions
// changed intentionally with that behaviour change.
const { mockKyc } = vi.hoisted(() => ({ mockKyc: { current: null } }));
vi.mock("../../../hooks/useKycVerification", () => ({
  useKycVerification: () => mockKyc.current,
}));

const auth = { user: { firstName: "Adaeze", lastName: "Okafor", email: "adaeze@example.com" } };
vi.mock("../../../store/AuthContext.jsx", () => ({ useAuth: () => auth }));

function makeKyc(overrides = {}) {
  const status = overrides.status ?? "NOT_STARTED";
  const base = {
    summary: { status, canStart: true, attemptsAllowed: true },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    status,
    canStart: true,
    canRefreshToken: false,
    attemptsAllowed: true,
    activeAttemptId: null,
    idType: "BVN",
    setIdType: vi.fn(),
    localError: "",
    capturing: false,
    confirmed: false,
    handleStart: vi.fn(),
    handleResume: vi.fn(),
    handleRefreshStatus: vi.fn(),
    isApproved: status === "APPROVED",
    isInReview: status === "IN_REVIEW",
    isPending: status === "PENDING",
    isNotStarted: status === "NOT_STARTED",
    canRetry: true,
    showResume: false,
    startPending: false,
    resumePending: false,
  };
  const merged = { ...base, ...overrides };
  merged.summary = {
    status,
    canStart: true,
    attemptsAllowed: true,
    ...(overrides.summary ?? {}),
  };
  return merged;
}

function renderWizard(props = {}) {
  const onClose = vi.fn();
  const utils = render(
    <MemoryRouter>
      <KycWizardModal open onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { onClose, ...utils };
}

beforeEach(() => {
  mockKyc.current = makeKyc();
});
afterEach(cleanup);

describe("KycWizardModal", () => {
  it("lands a fresh account on the ID choice", () => {
    renderWizard();
    expect(screen.getByRole("dialog", { name: "Identity verification" })).toBeTruthy();
    expect(screen.getByText("Pick the ID you'll verify with")).toBeTruthy();
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Continue with BVN/ })).toBeTruthy();
  });

  it("shows the Glass Pass rail with the member's name and a locked count", () => {
    renderWizard();
    const rail = screen.getByLabelText("Your Glass Pass", { selector: "aside" });
    expect(rail).toBeTruthy();
    expect(rail.textContent).toContain("Adaeze Okafor");
    expect(rail.textContent).toContain("Locked");
    expect(rail.textContent).toContain("ID · BVN");
    expect(rail.textContent).toContain("0 of 3 features unlocked");
  });

  it("surfaces the trust note under the sensitive choice", () => {
    renderWizard();
    expect(screen.getByText(/Glass never sees or stores the raw number/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not now" })).toBeTruthy();
  });

  it("offers only the id types the backend accepts for a new attempt", () => {
    renderWizard();
    const cards = screen.getAllByRole("radio");
    expect(cards.map((c) => c.textContent)).toEqual(["BVN", "NIN"]);
    // Retired KycIdType values stay labelable but must never be selectable.
    expect(screen.queryByText("Voter's card")).toBeNull();
    expect(screen.queryByText("NIN slip")).toBeNull();
  });

  it("advances to the hand-off step and previews what Smile ID will ask for", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Continue with BVN/ }));
    expect(screen.getByText("Here's what happens next")).toBeTruthy();
    expect(screen.getByText("Step 2 of 3")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Smile ID" })).toBeTruthy();
    expect(screen.getByText("Enter your BVN")).toBeTruthy();
    expect(screen.getByText("Take a quick selfie")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  it("opens an approved account directly on the verified status card", () => {
    mockKyc.current = makeKyc({ status: "APPROVED", canStart: false });
    renderWizard();
    expect(screen.getByText("Identity verified")).toBeTruthy();
    // The unlock list states what verification just switched on.
    expect(screen.getAllByText("Set up payment plans").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
  });

  it("marks the pass verified once the account is approved", () => {
    mockKyc.current = makeKyc({ status: "APPROVED", canStart: false });
    renderWizard();
    const rail = screen.getByLabelText("Your Glass Pass", { selector: "aside" });
    expect(rail.textContent).toContain("Verified");
    expect(rail.textContent).toContain("3 of 3 features unlocked");
    expect(rail.textContent).toContain("Identity confirmed");
  });

  it("shows the live narrative and the progress checklist for an in-flight check", () => {
    mockKyc.current = makeKyc({ status: "PENDING", isPending: true, canStart: false });
    renderWizard();
    expect(screen.getByText("Uploading…")).toBeTruthy();
    expect(screen.queryByText("Pending")).toBeNull();
    expect(screen.getByText("Get your result")).toBeTruthy();
    expect(screen.getByText("Match against your BVN record")).toBeTruthy();
  });

  it("gives retry guidance when a check ends unsuccessfully", () => {
    mockKyc.current = makeKyc({ status: "REJECTED", canStart: true });
    renderWizard();
    expect(screen.getByText("Verification rejected")).toBeTruthy();
    expect(screen.getByText("Before you try again")).toBeTruthy();
    expect(screen.getByText("Face a window or lamp so your face is lit evenly.")).toBeTruthy();
    expect(screen.getByText("Check your BVN digits before you submit.")).toBeTruthy();
  });

  it("ignores Escape while the Smile ID capture is open", () => {
    mockKyc.current = makeKyc({ status: "PENDING", isPending: true, capturing: true });
    const { onClose } = renderWizard();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape when no capture is in flight", () => {
    const { onClose } = renderWizard();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wires attempt history only when a history path is provided", () => {
    mockKyc.current = makeKyc({ status: "PENDING", isPending: true, canStart: false });
    const { onClose } = renderWizard({ historyPath: "/dashboard/verify-identity/history" });
    fireEvent.click(screen.getByRole("button", { name: "View attempt history" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
