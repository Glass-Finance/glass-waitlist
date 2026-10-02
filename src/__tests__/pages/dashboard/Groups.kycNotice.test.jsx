import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// A COMMUNITY_OWNER whose KYC isn't APPROVED is silently downgraded to
// COMMUNITY_MEMBER permissions server-side, so GET /communities/{id}/groups
// comes back 403 with the generic
// "Community permission is required: community.groups.read". CommunityAdminGuard
// admits them anyway (it checks the role, not the KYC), so they reach a fully
// rendered page that then refuses to load itself with no way forward.
//
// These tests pin the distinction that matters: a KYC-gated 403 gets an
// explanation, and every other failure keeps the generic message it had before.
// Getting this wrong in the other direction is the real risk -- explaining KYC
// for a random 500 would send an admin chasing verification for no reason.

const { mockGroups, mockMutations, mockKycGate } = vi.hoisted(() => ({
  mockGroups: { current: null },
  mockMutations: { current: {} },
  mockKycGate: { current: null },
}));

vi.mock("../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: () => mockGroups.current.communityId,
}));

vi.mock("../../../hooks/useGroups", async () => {
  const actual = await vi.importActual("../../../hooks/useGroups");
  return {
    ...actual,
    useCommunityGroups: () => mockGroups.current.list,
    useGroupMutations: () => mockMutations.current,
  };
});

vi.mock("../../../hooks/useCommunityMembers", () => ({
  useCommunityMembers: () => ({ members: [], isLoading: false, error: null }),
}));

vi.mock("../../../hooks/usePageTitle", () => ({ usePageTitle: vi.fn() }));

vi.mock("../../../hooks/useKycGate", () => ({
  useKycGate: () => mockKycGate.current,
}));

// The page now opens the REAL KycWizardModal, so the flow's own data layer is
// mocked at the hook boundary — the same approach
// __tests__/components/kyc/KycWizardModal.test.jsx already uses, rather than
// stubbing the modal out. That keeps these tests asserting that the shipped
// wizard actually opens, not that a placeholder was rendered.
const { mockKycVerification } = vi.hoisted(() => ({ mockKycVerification: { current: null } }));
vi.mock("../../../hooks/useKycVerification", () => ({
  useKycVerification: () => mockKycVerification.current,
}));

// Trimmed to the fields useKycFlow's step machine and footer read. Mirrors the
// factory in KycWizardModal.test.jsx; `status` drives the branch, so the same
// helper covers the start / continue / approved cases.
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

const Groups = (await import("../../../pages/dashboard/Groups")).default;

const notice = () => screen.queryByTestId("community-staff-kyc-notice");

// The exact refusal the groups list actually returns, verified live against the
// backend: note the message does NOT mention KYC, which is exactly why the page
// has to consult the account's own KYC status rather than rely on the
// description. (The backend reports community.members.read here too, not
// community.groups.read -- both lists run the same permission check.)
const downgrade403 = () => ({
  response: {
    status: 403,
    data: { description: "Community permission is required: community.members.read" },
  },
});

// Some other refusal entirely -- not a community-permission one.
const other403 = () => ({ response: { status: 403, data: { description: "Forbidden" } } });

const serverError = () => ({ response: { status: 500, data: {} } });

const failed = (error) => ({ isError: true, error });

// Mirrors the real useKycGate surface the page uses. closeGate/completeGate
// must be present and callable: the page calls them inside the wizard
// handlers, and a missing method would throw and mask what the test is meant
// to prove.
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

function page(content, overrides = {}) {
  return {
    data: { content, totalElements: content.length, totalPages: 1, pageNumber: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const group = (overrides = {}) => ({
  id: "group-1",
  name: "Choir",
  status: "ACTIVE",
  memberCount: 4,
  ...overrides,
});

const noopMutation = () => ({ mutateAsync: vi.fn(), isPending: false });

beforeEach(() => {
  mockKycGate.current = kyc("APPROVED", { isApproved: true });
  mockKycVerification.current = kycFlowState("NOT_STARTED");
  mockGroups.current = { communityId: "glass-crew", list: page([]) };
  mockMutations.current = {
    create: noopMutation(),
    update: noopMutation(),
    remove: noopMutation(),
    archive: noopMutation(),
    unarchive: noopMutation(),
    addMembers: noopMutation(),
    removeMembers: noopMutation(),
  };
});

afterEach(() => vi.clearAllMocks());

// The page invalidates community queries once KYC is APPROVED, so the spy has
// to live on the real client the page holds — hence hoisted and installed here
// rather than asserted via a mock module.
const { invalidateSpy } = vi.hoisted(() => ({ invalidateSpy: { current: null } }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  invalidateSpy.current = vi.spyOn(client, "invalidateQueries");
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/dashboard/groups?community=glass-crew"]}>
        <Groups />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// The wizard is only ever opened by the notice's action, never on load.
const wizardDialog = () => screen.queryByRole("dialog", { name: /Identity verification/i });
const verifyButton = () => screen.queryByTestId("community-staff-kyc-verify");

describe("Groups KYC-gated 403", () => {
  it("explains the KYC requirement instead of showing a bare error", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.getByText(/approved identity verification is required/i)).toBeTruthy();
    expect(screen.getByText(/before you can view your groups/i)).toBeTruthy();
  });

  it("keeps the page usable -- the notice is inline, not a blocking modal", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    // The generic error and its retry affordance are gone, but the page chrome
    // around them survives, so the user can search, navigate or leave.
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    expect(screen.getByRole("button", { name: /New group/i })).toBeTruthy();
  });

  it("explains it for every not-yet-approved status, not just NOT_STARTED", () => {
    for (const status of ["INITIATED", "PROCESSING", "IN_REVIEW", "REJECTED"]) {
      mockKycGate.current = kyc(status);
      mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };
      const { unmount } = renderPage();
      expect(notice(), `expected the notice for ${status}`).not.toBeNull();
      unmount();
    }
  });

  it("offers the verification action but opens nothing unbidden", () => {
    // The notice is an explanation, not an interception: the wizard waits for
    // a deliberate click. A modal appearing on load would also be wrong for a
    // page the user might just be passing through.
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).not.toBeNull();
    expect(verifyButton()).not.toBeNull();
    expect(wizardDialog()).toBeNull();
  });
});

describe("Groups verification action", () => {
  function gated() {
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };
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
    // GlassModal, and the flow's own intro step is what renders.
    expect(wizardDialog()).not.toBeNull();
    expect(screen.getByRole("button", { name: /Get started/i })).toBeTruthy();
  });

  it("resumes an attempt already in flight rather than restarting it", () => {
    // The verb comes from the notice's own isKycInFlight check, which reads the
    // GATE's status — that's the account's real KYC state, independent of what
    // the modal's own hook happens to be seeded with in a given test.
    mockKycGate.current = kyc("PROCESSING");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };
    mockKycVerification.current = kycFlowState("PROCESSING", { showResume: true });
    renderPage();

    expect(verifyButton().textContent).toContain("Continue verification");
    fireEvent.click(verifyButton());
    expect(wizardDialog()).not.toBeNull();
  });

  it("invalidates community queries and closes when verification is approved", () => {
    gated();
    // Seed APPROVED so the flow's footer offers "Done", which is the only path
    // that calls onComplete (useKycFlow only completes on an approved outcome).
    mockKycVerification.current = kycFlowState("APPROVED");
    renderPage();
    fireEvent.click(verifyButton());
    expect(wizardDialog()).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Done$/i }));

    expect(wizardDialog()).toBeNull();
    // Approved completion must go through the gate's own resume, not just
    // close it — that is what CommunitiesHome/MyCommunities do.
    expect(mockKycGate.current.completeGate).toHaveBeenCalled();
    expect(mockKycGate.current.closeGate).not.toHaveBeenCalled();
    // The load-bearing assertion. Without it the list keeps serving the
    // pre-approval 403 (staleTime 30s) and the page falls into the generic
    // "Couldn't load groups." error the moment the notice stops matching.
    expect(invalidateSpy.current).toHaveBeenCalledWith({ queryKey: ["community", "glass-crew"] });
  });

  it("closes without invalidating or navigating when the wizard is dismissed", () => {
    gated();
    mockKycVerification.current = kycFlowState("NOT_STARTED");
    renderPage();
    fireEvent.click(verifyButton());

    // "Not now" is the intro step's secondary action -> onDismiss.
    fireEvent.click(screen.getByRole("button", { name: /Not now/i }));

    expect(wizardDialog()).toBeNull();
    // Dismissal is closeGate, never completeGate: the permissions haven't
    // changed, so nothing should be refetched and nothing should resume.
    expect(mockKycGate.current.closeGate).toHaveBeenCalled();
    expect(mockKycGate.current.completeGate).not.toHaveBeenCalled();
    expect(invalidateSpy.current).not.toHaveBeenCalledWith({
      queryKey: ["community", "glass-crew"],
    });
    expect(notice()).not.toBeNull();
  });
});

describe("Groups non-KYC failures keep their generic error", () => {
  // The generic branch is identified by its Retry affordance: it's the one
  // thing only that branch renders. Asserting on it (rather than on the
  // message) is what makes "the old behaviour survived" checkable, since
  // getErrorMessage prefers the server's own description over the page's
  // fallback string.
  it("shows the generic error for a 403 that is not a community-permission refusal", () => {
    // Same incomplete-KYC account, but refused for an unrelated reason -- e.g.
    // a community in the ?community= param they don't belong to. Claiming KYC
    // here would tell them their role is active when it isn't.
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(other403())) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("shows the generic error for a server error", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(serverError())) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("does not blame KYC while the KYC status is still loading", () => {
    mockKycGate.current = kyc(null, { isLoading: true });
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("does not blame KYC when the KYC summary request itself failed", () => {
    // A /kyc outage must not turn every 403 into "go verify your identity".
    mockKycGate.current = kyc(null, { isError: true });
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("does not blame KYC for an exempt account", () => {
    // Platform staff are backend-exempt from the downgrade, so a 403 they hit
    // on a community page is about something else entirely.
    mockKycGate.current = kyc("NOT_STARTED", { exempt: true });
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});

describe("Groups normal access is untouched", () => {
  it("renders the group list for an approved admin", () => {
    mockGroups.current = { communityId: "glass-crew", list: page([group()]) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText("Choir")).toBeTruthy();
  });

  it("still shows the empty state, never the notice, on a successful empty list", () => {
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([]) };

    renderPage();

    expect(notice()).toBeNull();
    expect(screen.getByText(/No groups yet/i)).toBeTruthy();
  });

  it("shows the notice rather than the empty state when the list is denied", () => {
    // The 403-vs-empty distinction: a refused request is not an empty result,
    // and must never look like "this community has no groups".
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.queryByText(/No groups yet/i)).toBeNull();
  });
});
