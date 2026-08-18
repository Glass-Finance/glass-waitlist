import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Invites from "../../../pages/memberApp/Invites";
import { useInvites, useMyJoinRequests } from "../../../hooks/useInvites";

vi.mock("../../../hooks/useInvites");
vi.mock("../../../api/invites", () => ({ getInvite: vi.fn() }));

const navigateSpy = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

function renderInvites() {
  return render(
    <MemoryRouter>
      <Invites />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateSpy.mockClear();
  sessionStorage.clear();
});

describe("Invites empty state", () => {
  it("shows the empty state instead of silently redirecting away", () => {
    // Regression test: this page used to auto-navigate to /member/home the
    // instant it mounted with nothing to show (see the removed effect --
    // "Member was added directly by an admin ... send them straight to
    // home"), which fired before the empty state a few lines below in the
    // same file could ever render. Anyone landing here empty saw a flash
    // of the page, then got bounced with no explanation.
    useInvites.mockReturnValue({
      invites: [],
      isLoading: false,
      error: null,
      accept: vi.fn(),
      reject: vi.fn(),
      isAccepting: false,
      isRejecting: false,
      refresh: vi.fn(),
    });
    useMyJoinRequests.mockReturnValue({ joinRequests: [], isLoading: false });

    renderInvites();

    expect(screen.getByText("No invitations yet")).toBeDefined();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("still navigates to Home when that button is actually clicked", async () => {
    useInvites.mockReturnValue({
      invites: [],
      isLoading: false,
      error: null,
      accept: vi.fn(),
      reject: vi.fn(),
      isAccepting: false,
      isRejecting: false,
      refresh: vi.fn(),
    });
    useMyJoinRequests.mockReturnValue({ joinRequests: [], isLoading: false });

    const { getByText } = renderInvites();
    getByText("Go to Home").click();

    expect(navigateSpy).toHaveBeenCalledWith("/member/home", { replace: true });
  });

  it("renders invite cards instead of the empty state when there's something to show", () => {
    useInvites.mockReturnValue({
      invites: [{ id: "inv1", community: { name: "Kings College Alumni" } }],
      isLoading: false,
      error: null,
      accept: vi.fn(),
      reject: vi.fn(),
      isAccepting: false,
      isRejecting: false,
      refresh: vi.fn(),
    });
    useMyJoinRequests.mockReturnValue({ joinRequests: [], isLoading: false });

    renderInvites();

    expect(screen.getByText("Kings College Alumni")).toBeDefined();
    expect(screen.queryByText("No invitations yet")).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
