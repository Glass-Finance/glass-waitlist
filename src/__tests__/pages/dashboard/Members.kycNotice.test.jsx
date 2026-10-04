import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// The Members counterpart to Groups.kycNotice.test.jsx, and it exists for a
// different structural reason: Groups renders its error as a standalone
// paragraph, while Members renders it as a <tr> inside the table. The KYC
// notice therefore has to fit inside a table cell -- a block-level card in the
// wrong place would break the table layout, not just the copy.
//
// Same root cause on the wire: a COMMUNITY_OWNER whose KYC isn't APPROVED is
// silently downgraded to COMMUNITY_MEMBER permissions server-side, so
// GET /communities/{id}/members comes back 403 with the generic
// "Community permission is required: community.members.read" (verified live).

const { mockMembers, mockMemberMutations, mockKycGate, mockKycVerification, invalidateSpy } =
  vi.hoisted(() => ({
    mockMembers: { current: null },
    mockMemberMutations: { current: {} },
    mockKycGate: { current: null },
    mockKycVerification: { current: null },
    invalidateSpy: { current: null },
  }));

vi.mock("../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: () => "comm-1",
}));

vi.mock("../../../hooks/useCommunity", () => ({
  useCommunity: () => ({ data: { id: "comm-1", name: "Kings College Alumni", slug: "kca" } }),
}));

vi.mock("../../../hooks/useMembersWithPayments", () => ({
  useMembersWithPayments: () => mockMembers.current,
}));

vi.mock("../../../hooks/useCommunityMembers", () => ({
  useCommunityMembers: () => mockMemberMutations.current,
  useRoles: () => ({ data: [{ id: "role-1", name: "Community Member" }] }),
}));

vi.mock("../../../hooks/useJoinRequests", () => ({
  useJoinRequests: () => ({ requests: [], isLoading: false, error: null }),
  requestStatusOf: (r) => r?.status,
  requesterOf: (r) => r,
}));

vi.mock("../../../hooks/useKycGate", () => ({ useKycGate: () => mockKycGate.current }));

const Members = (await import("../../../pages/dashboard/Members")).default;

const notice = () => screen.queryByTestId("community-staff-kyc-notice");

// Verified live against the backend for a KYC-incomplete community owner.
const downgrade403 = () => ({
  response: {
    status: 403,
    data: { description: "Community permission is required: community.members.read" },
  },
});

const other403 = () => ({ response: { status: 403, data: { description: "Forbidden" } } });

const failed = (error) => ({ error });

// Mirrors the real useKycGate surface the page uses. closeGate/completeGate
// must be callable: the page calls them inside the wizard handlers, and a
// missing method would throw and mask what the test is meant to prove.
const kyc = (status, extra = {}) => ({
  status,
  isApproved: false,
  isLoading: false,
  isError: false,
  exempt: false,
  gateOpen: false,
  closeGate: vi.fn(),
  completeGate: vi.fn(),
  openGate: vi.fn(),
  enforce: vi.fn(),
  ...extra,
});

// The page opens the REAL KycWizardModal, so the flow's own data layer is
// mocked at the hook boundary — the same approach
// __tests__/components/kyc/KycWizardModal.test.jsx uses, rather than stubbing
// the modal out. That keeps these tests asserting the shipped wizard opens,
// not that a placeholder rendered.
vi.mock("../../../hooks/useKycVerification", () => ({
  useKycVerification: () => mockKycVerification.current,
}));

// The wizard reads the signed-in member for its Glass Pass rail, so the auth
// context is mocked at the boundary like every other consumer in this file —
// the wizard is still the real component.
vi.mock("../../../store/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: { firstName: "Adaeze", lastName: "Okafor", email: "adaeze@example.com" },
  }),
}));

// Trimmed to the fields useKycFlow's step machine and footer read; `status`
// drives the branch, so one factory covers start / continue / approved.
function kycFlowState(status, overrides = {}) {
  return {
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
    startPending: false,
    resumePending: false,
    handleStart: vi.fn(),
    handleResume: vi.fn(),
    handleRefreshStatus: vi.fn(),
    isApproved: status === "APPROVED",
    isInReview: status === "IN_REVIEW",
    isPending: status === "PENDING",
    isNotStarted: status === "NOT_STARTED",
    canRetry: true,
    showResume: false,
    ...overrides,
  };
}

function result(members, overrides = {}) {
  return {
    members,
    obligations: [],
    transactions: [],
    isLoading: false,
    error: null,
    ...overrides,
  };
}

function member(overrides = {}) {
  return {
    id: "member-1",
    firstName: "Amina",
    lastName: "Bello",
    email: "amina@example.com",
    role: { name: "Community Member", code: "COMMUNITY_MEMBER" },
    status: "ACTIVE",
    billingExempt: false,
    planCount: 1,
    paidCount: 1,
    totalCount: 1,
    failedCount: 0,
    obligations: [],
    transactions: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockKycGate.current = kyc("APPROVED", { isApproved: true });
  mockKycVerification.current = kycFlowState("NOT_STARTED");
  mockMembers.current = result([member()]);
  mockMemberMutations.current = {
    inviteMember: { mutateAsync: vi.fn(), isPending: false },
    removeMember: { mutate: vi.fn(), isPending: false },
  };
});

afterEach(() => vi.clearAllMocks());

// The page invalidates community queries once KYC is APPROVED, so the spy has
// to sit on the real client the page holds. The provider is new here too —
// useQueryClient() needs one now that the wizard is wired.
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  invalidateSpy.current = vi.spyOn(client, "invalidateQueries");
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// The wizard is only ever opened by the notice's action, never on load.
const wizardDialog = () => screen.queryByRole("dialog", { name: /Identity verification/i });
const verifyButton = () => screen.queryByTestId("community-staff-kyc-verify");

describe("Members KYC-gated 403", () => {
  it("explains the KYC requirement instead of 'Couldn't load members.'", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.getByText(/approved identity verification is required/i)).toBeTruthy();
    expect(screen.getByText(/before you can view your members list/i)).toBeTruthy();
    expect(screen.queryByText("Couldn't load members.")).toBeNull();
  });

  it("renders the notice inside the table so the layout survives", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    // A block-level card dropped anywhere but a cell would break the table.
    expect(notice().closest("td")).not.toBeNull();
  });

  it("does not claim there are no members -- a refusal is not an empty list", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.queryByText("No members found.")).toBeNull();
  });

  it("offers the verification action but opens nothing unbidden", () => {
    // The notice is an explanation, not an interception: the wizard waits for
    // a deliberate click. A modal on load would also be wrong for a page the
    // user might just be passing through.
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).not.toBeNull();
    expect(verifyButton()).not.toBeNull();
    expect(wizardDialog()).toBeNull();
  });
});

describe("Members verification action", () => {
  function gated() {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(downgrade403()));
  }

  it("opens the shipped KYC wizard when the action is used", () => {
    gated();
    mockKycVerification.current = kycFlowState("NOT_STARTED");
    renderPage();

    expect(wizardDialog()).toBeNull();
    // fireEvent, not a raw .click(): opening the modal is a state update that
    // has to flush for the dialog to exist.
    fireEvent.click(verifyButton());

    // The real modal, not a stub: role=dialog / aria-label come from
    // GlassModal, and the flow's own first step is what renders. A fresh
    // account lands on the ID choice — the overview step is now the Glass
    // Pass rail, so there is no "Get started" hand-off any more.
    expect(wizardDialog()).not.toBeNull();
    expect(screen.getByRole("button", { name: /Continue with/i })).toBeTruthy();
  });

  it("resumes an attempt already in flight rather than restarting it", () => {
    // The verb comes from the notice's own isKycInFlight check, which reads the
    // GATE's status — the account's real KYC state, independent of what the
    // modal's own hook is seeded with here.
    mockKycGate.current = kyc("PROCESSING");
    mockMembers.current = result([], failed(downgrade403()));
    mockKycVerification.current = kycFlowState("PROCESSING", { showResume: true });
    renderPage();

    expect(verifyButton().textContent).toContain("Continue verification");
    fireEvent.click(verifyButton());
    expect(wizardDialog()).not.toBeNull();
  });

  it("invalidates community queries and closes when verification is approved", () => {
    gated();
    // Seed APPROVED so the flow's footer offers "Done", the only path that
    // calls onComplete (useKycFlow only completes on an approved outcome).
    mockKycVerification.current = kycFlowState("APPROVED");
    renderPage();
    fireEvent.click(verifyButton());
    expect(wizardDialog()).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Done$/i }));

    expect(wizardDialog()).toBeNull();
    // Approved completion resumes through the gate, as the other community
    // surfaces do, rather than merely closing.
    expect(mockKycGate.current.completeGate).toHaveBeenCalled();
    expect(mockKycGate.current.closeGate).not.toHaveBeenCalled();
    // The load-bearing assertion. Without it the members request keeps serving
    // the pre-approval 403 (staleTime 2 min) and the page falls into the
    // generic "Couldn't load members." error once the notice stops matching.
    expect(invalidateSpy.current).toHaveBeenCalledWith({ queryKey: ["community", "comm-1"] });
  });

  it("closes without invalidating or navigating when the wizard is dismissed", () => {
    gated();
    mockKycVerification.current = kycFlowState("NOT_STARTED");
    renderPage();
    fireEvent.click(verifyButton());

    // "Not now" is the intro step's secondary action -> onDismiss.
    fireEvent.click(screen.getByRole("button", { name: /Not now/i }));

    expect(wizardDialog()).toBeNull();
    // Dismissal is closeGate, never completeGate: permissions haven't changed,
    // so nothing is refetched and nothing resumes.
    expect(mockKycGate.current.closeGate).toHaveBeenCalled();
    expect(mockKycGate.current.completeGate).not.toHaveBeenCalled();
    expect(invalidateSpy.current).not.toHaveBeenCalledWith({
      queryKey: ["community", "comm-1"],
    });
    expect(notice()).not.toBeNull();
  });
});

describe("Members non-KYC failures keep their generic error", () => {
  it("keeps 'Couldn't load members.' for a 403 that isn't a permission refusal", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([], failed(other403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });

  it("keeps the generic error while the KYC status is still loading", () => {
    mockKycGate.current = kyc(null, { isLoading: true });
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });

  it("keeps the generic error when the KYC summary request itself failed", () => {
    mockKycGate.current = kyc(null, { isError: true });
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });

  it("keeps the generic error for an exempt account", () => {
    mockKycGate.current = kyc("NOT_STARTED", { exempt: true });
    mockMembers.current = result([], failed(downgrade403()));

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Couldn't load members.")).toBeTruthy();
  });
});

describe("Members normal access is untouched", () => {
  it("renders the members table for an approved admin", () => {
    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Amina Bello")).toBeTruthy();
  });

  it("still shows the empty state, never the notice, on a successful empty list", () => {
    // A community with genuinely no members renders EmptyState, not the table.
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([]);

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("No members yet.")).toBeTruthy();
  });

  it("still shows the in-table empty row, never the notice, when a search matches nothing", () => {
    // The notice branch sits directly above this row in the same ternary, so
    // this pins that the gated 403 didn't shadow the ordinary "no matches"
    // state. hasRealMembers is true here, so the table renders at all.
    mockKycGate.current = kyc("NOT_STARTED");
    mockMembers.current = result([member()]);

    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search members…"), {
      target: { value: "zzzz-no-such-member" },
    });

    expect(notice()).toBeNull();
    expect(screen.getByText("No members found.")).toBeTruthy();
  });
});
