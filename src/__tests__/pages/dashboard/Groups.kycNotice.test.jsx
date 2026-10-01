import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

const kyc = (status, extra = {}) => ({
  status,
  isApproved: false,
  isLoading: false,
  isError: false,
  exempt: false,
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/dashboard/groups?community=glass-crew"]}>
        <Groups />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

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

  it("opens no wizard on load", () => {
    // PR A only states the situation. The verification flow, and resuming into
    // the page once it completes, is a separate change -- a modal appearing
    // unbidden would also be the wrong UX for a page you might just be passing
    // through.
    mockKycGate.current = kyc("NOT_STARTED");
    mockGroups.current = { communityId: "glass-crew", list: page([], failed(downgrade403())) };

    renderPage();

    expect(notice()).not.toBeNull();
    expect(screen.queryByTestId("community-staff-kyc-verify")).toBeNull();
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
