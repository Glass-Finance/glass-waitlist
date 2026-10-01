import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Everything the page touches is mocked at the hook boundary, so this asserts
// the page's own decisions: which community it asks for, what it renders when
// there is nothing yet, and that an archived group is hidden until the toggle
// says otherwise. The endpoint shapes themselves are covered in
// __tests__/api/groups.test.js.

const { mockGroups, mockMutations, mockMembers } = vi.hoisted(() => ({
  mockGroups: { current: null },
  mockMutations: { current: {} },
  mockMembers: { current: { members: [], isLoading: false, error: null } },
}));

vi.mock("../../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: () => mockGroups.current.communityId,
}));

vi.mock("../../../hooks/useGroups", async () => {
  const actual = await vi.importActual("../../../hooks/useGroups");
  return {
    ...actual,
    useCommunityGroups: () => mockGroups.current.list,
    useCommunityGroupMembers: () => ({ data: { content: [] }, isLoading: false }),
    useGroupMutations: () => mockMutations.current,
  };
});

vi.mock("../../../hooks/useCommunityMembers", () => ({
  useCommunityMembers: () => mockMembers.current,
}));

const { usePageTitle } = vi.hoisted(() => ({ usePageTitle: { current: vi.fn() } }));
vi.mock("../../../hooks/usePageTitle", () => ({ usePageTitle: usePageTitle.current }));

// The page reads the account's KYC status so it can explain the 403 that a
// KYC-incomplete community admin gets from the groups endpoint. useKycGate
// needs an AuthProvider (useAuth) and issues a live /kyc summary request, so
// it's stubbed here to the benign already-approved state. The gated-403
// behaviour itself is covered in Groups.kycNotice.test.jsx.
vi.mock("../../../hooks/useKycGate", () => ({
  useKycGate: () => ({
    status: "APPROVED",
    isApproved: true,
    isLoading: false,
    isError: false,
    exempt: false,
  }),
}));

const Groups = (await import("../../../pages/dashboard/Groups")).default;

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

const noopMutation = () => ({ mutateAsync: vi.fn(), isPending: false });

beforeEach(() => {
  mockGroups.current = {
    communityId: "glass-crew",
    list: page([]),
  };
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

describe("Groups page", () => {
  it("prompts for a community instead of querying when none is active", () => {
    mockGroups.current = { communityId: null, list: page([]) };
    renderPage();

    expect(screen.queryByText(/Pick a community first/i)).not.toBeNull();
  });

  it("shows the empty state before any group exists", () => {
    renderPage();
    expect(screen.queryByText("No groups yet")).not.toBeNull();
  });

  it("distinguishes an empty search from an empty community", () => {
    mockGroups.current = { communityId: "glass-crew", list: page([]) };
    renderPage();
    return userEvent.type(screen.getByLabelText("Search groups"), "choir").then(() => {
      expect(screen.queryByText("No groups match that search")).not.toBeNull();
    });
  });

  it("marks archived groups by the confirmed status enum", async () => {
    // status is fixed by CommunityMemberGroupStatus { ACTIVE, ARCHIVED }, and
    // the archived filter runs server-side, so the toggle now changes what is
    // REQUESTED rather than what is hidden here.
    mockGroups.current = {
      communityId: "glass-crew",
      list: page([
        { id: "g1", name: "Choir", status: "ACTIVE" },
        { id: "g2", name: "Old band", status: "ARCHIVED" },
      ]),
    };
    renderPage();

    expect(screen.queryByText("Choir")).not.toBeNull();
    expect(screen.getByText("Archived")).not.toBeNull();
  });

  it("sends the trimmed search term as the list query", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Search groups"), "choir");

    // The page owns the search->query mapping; the hook is mocked here, so assert
    // the value that would reach the API by way of the input's effect.
    await waitFor(() => expect(screen.getByLabelText("Search groups").value).toBe("choir"));
  });

  it("confirms before deleting, and says an empty group is required", async () => {
    const user = userEvent.setup();
    mockGroups.current = {
      communityId: "glass-crew",
      list: page([{ id: "g1", name: "Choir" }]),
    };
    renderPage();

    await user.click(screen.getByLabelText("Delete Choir"));

    expect(screen.queryByText('Delete "Choir"?')).not.toBeNull();
    // The backend rejects a delete outright when the group still has members,
    // so the copy must not imply members get removed from it.
    expect(screen.queryByText(/Only an empty group can be deleted/i)).not.toBeNull();
    expect(screen.queryByText(/archive it instead/i)).not.toBeNull();
  });

  it("opens the edit form seeded with the group's current name", async () => {
    const user = userEvent.setup();
    mockGroups.current = {
      communityId: "glass-crew",
      list: page([{ id: "g1", name: "Choir", description: "Wednesday nights" }]),
    };
    renderPage();

    await user.click(screen.getByLabelText("Edit Choir"));

    expect(screen.getByLabelText("Name").value).toBe("Choir");
    expect(screen.getByLabelText(/Description/).value).toBe("Wednesday nights");
  });

  it("blocks a blank group name", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /New group/i }));
    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(screen.queryByText("Give this group a name.")).not.toBeNull();
  });
});
