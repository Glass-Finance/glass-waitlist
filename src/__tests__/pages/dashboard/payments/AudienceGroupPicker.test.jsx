import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AudienceGroupPicker from "../../../../pages/dashboard/payments/AudienceGroupPicker";

// The group half of the audience picker. The member half (AudienceMemberPicker)
// has no test of its own — it is covered through the two modals — but the group
// picker needs direct coverage for two behaviours the modals can't reach:
//
//   1. a 403 must be distinguishable from an empty list. The groups endpoint is
//      behind community.members.read, which the backend withholds from community
//      staff whose KYC isn't approved. Rendering "this community has no groups"
//      there would send an admin off to create groups that still wouldn't be
//      listable, so the two states must look different.
//   2. archived groups must not be selectable even if the backend returns them,
//      because a live plan can never release a group reference.
//
// The groups query is mocked at the hook, which is the seam the picker reads.
const GROUPS = [
  { id: "group-a", name: "Board", status: "ACTIVE" },
  { id: "group-b", name: "Choir", status: "ACTIVE" },
  { id: "group-z", name: "Disbanded", status: "ARCHIVED" },
];

let useCommunityGroupsMock;

vi.mock("../../../../hooks/useGroups", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCommunityGroups: (...args) => useCommunityGroupsMock(...args),
  };
});

beforeEach(() => {
  useCommunityGroupsMock = vi.fn(() => ({
    data: { content: GROUPS },
    isLoading: false,
    error: null,
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPicker(props = {}) {
  const onChange = vi.fn();
  render(<AudienceGroupPicker communityId="comm-1" selected={[]} onChange={onChange} {...props} />);
  return { onChange };
}

describe("AudienceGroupPicker — data and selection", () => {
  it("requests only ACTIVE groups, with a page size that won't silently truncate the list", () => {
    renderPicker();

    const [communityId, params] = useCommunityGroupsMock.mock.calls[0];
    expect(communityId).toBe("comm-1");
    // The list is paginated: a first-page-only picker would make later groups
    // unselectable with no indication anything was missing.
    expect(params).toMatchObject({ status: "ACTIVE" });
    expect(params.pageSize).toBeGreaterThanOrEqual(200);
  });

  it("renders the active groups and not the archived one", () => {
    renderPicker();

    expect(screen.getByText("Board")).toBeTruthy();
    expect(screen.getByText("Choir")).toBeTruthy();
    expect(screen.queryByText("Disbanded")).toBeNull();
  });

  it("sends the group RECORD id, not anything else on the object", () => {
    const { onChange } = renderPicker({ selected: [] });

    fireEvent.click(screen.getByLabelText("Board"));
    expect(onChange).toHaveBeenCalledWith(["group-a"]);

    cleanup();
    const second = renderPicker({ selected: ["group-a"] });
    fireEvent.click(screen.getByLabelText("Choir"));
    expect(second.onChange).toHaveBeenCalledWith(["group-a", "group-b"]);

    cleanup();
    const third = renderPicker({ selected: ["group-a", "group-b"] });
    fireEvent.click(screen.getByLabelText("Board"));
    // Deselect removes rather than appends.
    expect(third.onChange).toHaveBeenCalledWith(["group-b"]);
  });

  it("reflects the current selection count and supports select-all / clear", () => {
    const { onChange } = renderPicker({ selected: ["group-a"] });

    expect(screen.getByText("1 of 2 selected")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    // Only active groups — the archived one is never in the "select all" set.
    expect(onChange).toHaveBeenCalledWith(["group-a", "group-b"]);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("tolerates a missing selection prop", () => {
    render(<AudienceGroupPicker communityId="comm-1" onChange={vi.fn()} />);

    expect(screen.getByText("0 of 2 selected")).toBeTruthy();
  });
});

describe("AudienceGroupPicker — loading", () => {
  it("shows a loading state and no list", () => {
    useCommunityGroupsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderPicker();

    expect(screen.getByText("Loading groups…")).toBeTruthy();
    expect(screen.queryByText("Board")).toBeNull();
  });
});

describe("AudienceGroupPicker — empty vs unavailable", () => {
  it("explains an empty community differently from a 403", () => {
    // Genuinely no groups.
    useCommunityGroupsMock.mockReturnValue({
      data: { content: [] },
      isLoading: false,
      error: null,
    });
    const empty = renderPicker();
    expect(empty).toBeTruthy();
    expect(screen.getByText(/has no groups yet/)).toBeTruthy();
    cleanup();

    // Forbidden — the KYC/permission downgrade. Must NOT read as "no groups".
    useCommunityGroupsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { response: { status: 403 } },
    });
    renderPicker();
    expect(screen.getByText(/don't currently allow access/)).toBeTruthy();
    expect(screen.queryByText(/has no groups yet/)).toBeNull();
  });

  it("distinguishes a 403 from a non-permission error", () => {
    useCommunityGroupsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { response: { status: 500 } },
    });
    renderPicker();

    expect(screen.getByText(/couldn't be loaded/)).toBeTruthy();
    expect(screen.queryByText(/permissions/)).toBeNull();
  });

  it("explains the all-archived case distinctly from the no-groups case", () => {
    // A community whose only groups are archived can't have a group-audience
    // plan, and the reason is different from "you never made a group".
    useCommunityGroupsMock.mockReturnValue({
      data: { content: [GROUPS[2]] },
      isLoading: false,
      error: null,
    });
    renderPicker();

    expect(screen.getByText(/all archived/)).toBeTruthy();
    expect(screen.queryByText(/has no groups yet/)).toBeNull();
  });
});

describe("AudienceGroupPicker — archived groups cannot be selected", () => {
  it("never offers an archived group, even returned alongside active ones", () => {
    renderPicker();

    expect(screen.queryByLabelText("Disbanded")).toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("omits an archived group from select-all", () => {
    const { onChange } = renderPicker({ selected: [] });

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(onChange).toHaveBeenCalledWith(["group-a", "group-b"]);
    expect(onChange.mock.calls[0][0]).not.toContain("group-z");
  });

  it("leaves an already-selected archived group out of select-all rather than re-adding it", () => {
    // A plan edited after its group was archived still carries that id. Select-all
    // must not resurrect it, or saving would re-point the plan at a group that
    // can't be released.
    const { onChange } = renderPicker({ selected: ["group-z"] });

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(onChange).toHaveBeenCalledWith(["group-a", "group-b"]);
  });
});
