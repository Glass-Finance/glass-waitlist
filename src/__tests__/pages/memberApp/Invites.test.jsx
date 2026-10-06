import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Invites from "../../../pages/memberApp/Invites";
import { useInvites, useMyJoinRequests, useRevokeMyJoinRequest } from "../../../hooks/useInvites";

vi.mock("../../../hooks/useInvites");
vi.mock("../../../api/invites", () => ({ getInvite: vi.fn() }));

beforeEach(() => {
  useRevokeMyJoinRequest.mockReturnValue({ revokeJoinRequest: vi.fn(), isRevoking: false });
});

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
    useRevokeMyJoinRequest.mockReturnValue({
      revokeJoinRequest: vi.fn(),
      isRevoking: false,
    });

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
    useRevokeMyJoinRequest.mockReturnValue({
      revokeJoinRequest: vi.fn(),
      isRevoking: false,
    });

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
    useRevokeMyJoinRequest.mockReturnValue({
      revokeJoinRequest: vi.fn(),
      isRevoking: false,
    });

    renderInvites();

    expect(screen.getByText("Kings College Alumni")).toBeDefined();
    expect(screen.queryByText("No invitations yet")).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

// The member's own join requests were rendered as "Your request to join is
// pending" for every status, so an approved or declined request still looked
// untouched, the reviewer's reason was never shown, and there was no way to
// withdraw a request that was never going to be approved.
describe("Invites join requests", () => {
  function req(overrides = {}) {
    return {
      id: "req-1",
      status: "PENDING",
      community: { id: "glass-crew", name: "Glass Crew" },
      reviewComment: null,
      ...overrides,
    };
  }

  function renderWith(joinRequests, revokeJoinRequest = vi.fn()) {
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
    useMyJoinRequests.mockReturnValue({ joinRequests, isLoading: false });
    useRevokeMyJoinRequest.mockReturnValue({ revokeJoinRequest, isRevoking: false });
    renderInvites();
    return revokeJoinRequest;
  }

  it("reports the request's real status, not a hardcoded pending", () => {
    renderWith([req({ status: "APPROVED" })]);
    expect(screen.getByText("Approved")).toBeDefined();
    expect(screen.queryByText("Pending")).toBeNull();
    expect(screen.queryByText(/waiting for the community/i)).toBeNull();
  });

  it("shows the community's reason on a declined request", () => {
    renderWith([req({ status: "REJECTED", reviewComment: "Group is full this term" })]);
    expect(screen.getByText("Declined")).toBeDefined();
    expect(screen.getByText(/Group is full this term/)).toBeDefined();
  });

  it("offers withdraw only while the request is pending", () => {
    renderWith([req({ status: "PENDING" }), req({ id: "req-2", status: "REJECTED" })]);
    // One withdraw affordance, for the pending row only.
    expect(screen.getAllByRole("button", { name: "Withdraw" })).toHaveLength(1);
  });

  it("withdraws the right request after confirming", async () => {
    const revoke = renderWith([req({ status: "PENDING" })], vi.fn().mockResolvedValue(undefined));

    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, withdraw" }));

    expect(revoke).toHaveBeenCalledWith("glass-crew", "req-1");
  });

  it("keeps the request when the confirmation is dismissed", () => {
    const revoke = renderWith([req({ status: "PENDING" })], vi.fn().mockResolvedValue(undefined));

    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));

    expect(revoke).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDefined();
  });
});
