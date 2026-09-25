import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import KycWizardModal from "../../../components/kyc/KycWizardModal";

// The wizard runs on useKycVerification's state machine — mocked at the
// hook boundary (repo convention: mock API/hooks, never hit prod
// services). mockKyc is mutable so each test seeds a server status.
const { mockKyc } = vi.hoisted(() => ({ mockKyc: { current: null } }));
vi.mock("../../../hooks/useKycVerification", () => ({
  useKycVerification: () => mockKyc.current,
}));

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
  it("lands a fresh account on the payoff overview step", () => {
    renderWizard();
    expect(screen.getByRole("dialog", { name: "Identity verification" })).toBeTruthy();
    expect(screen.getByText("One quick check, then you're in")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
    // 01/02/03 expectations row from the intro sequence
    expect(screen.getByText("01")).toBeTruthy();
    expect(screen.getByText("You're verified")).toBeTruthy();
  });

  it("advances overview → ID type and surfaces the trust note there", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    expect(screen.getByText("Which ID will you use?")).toBeTruthy();
    expect(screen.getByText(/Glass never sees or stores the raw number/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  it("opens an approved account directly on the verified status card", () => {
    mockKyc.current = makeKyc({ status: "APPROVED", canStart: false });
    renderWizard();
    expect(screen.getByText("Identity verified")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
  });

  it("shows the live narrative for an in-flight verification, not a static label", () => {
    mockKyc.current = makeKyc({ status: "PENDING", isPending: true, canStart: false });
    renderWizard();
    expect(screen.getByText("Uploading…")).toBeTruthy();
    expect(screen.queryByText("Pending")).toBeNull();
  });

  it("shows the capture-prep viewfinder step once ID type is chosen", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText(/Capture your BVN/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open secure capture" })).toBeTruthy();
    expect(screen.getByText(/never the photo/)).toBeTruthy();
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
