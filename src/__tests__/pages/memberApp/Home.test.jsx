import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../../../pages/memberApp/Home";
import { usePayments, usePendingPaymentVerification } from "../../../hooks/usePayments";
import { useMyCommunities } from "../../../hooks/useMyAccount";
import { useNotifications } from "../../../hooks/useNotifications";
import { useInvites, useMyJoinRequests } from "../../../hooks/useInvites";
import { useJoinApprovalWatcher } from "../../../hooks/useJoinApproval";

vi.mock("../../../hooks/usePayments");
vi.mock("../../../hooks/useMyAccount");
vi.mock("../../../hooks/useNotifications");
vi.mock("../../../hooks/useInvites");
vi.mock("../../../hooks/useJoinApproval");

// Needs an AuthProvider this test isn't rendering -- irrelevant to the
// Upcoming Payments/Payment History cards under test here.
vi.mock("../../../components/memberApp/SideDrawer", () => ({
  default: () => null,
}));

const navigateSpy = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

function mockPayments({ upcoming = [], history = [] } = {}) {
  usePayments.mockReturnValue({
    data: {
      nextDue: null,
      upcoming,
      history,
      community: { name: "Kings College Alumni", slug: "kca" },
    },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    hasNoCommunity: false,
    hasPendingCommunity: false,
    pendingCommunity: null,
    // >= 2 would route empty sections to the separate "nothing happening"
    // state instead of the per-card empty states this test targets.
    communityCount: 1,
  });
}

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateSpy.mockClear();
  usePendingPaymentVerification.mockReturnValue(undefined);
  useNotifications.mockReturnValue({ unreadCount: 0 });
  useInvites.mockReturnValue({ invites: [] });
  useMyJoinRequests.mockReturnValue({ joinRequests: [] });
  useJoinApprovalWatcher.mockReturnValue({ approved: [], dismiss: vi.fn() });
  useMyCommunities.mockReturnValue({ data: [] });
});

// Regression: "See All" used to render unconditionally on both cards (even
// over the "No Upcoming Payments"/"No Payment History" empty states) and in
// text-brand blue. Reference design only shows it once there's something to
// see, and in gray.
describe("Home's Upcoming Payments / Payment History \"See All\" links", () => {
  it("hides both See All links when there's no data in either section", () => {
    mockPayments({ upcoming: [], history: [] });
    renderHome();

    expect(screen.getByText("No Upcoming Payments")).toBeDefined();
    expect(screen.getByText("No Payment History")).toBeDefined();
    expect(screen.queryByText("See All")).toBeNull();
  });

  it("shows only Upcoming Payments' See All when it has data but History doesn't", () => {
    mockPayments({
      upcoming: [{ id: "p1", type: "recurring", amount: 2500, name: "Infrastructure Development", dueDate: "2026-09-15" }],
      history: [],
    });
    renderHome();

    expect(screen.getByText("No Payment History")).toBeDefined();
    const seeAllLinks = screen.getAllByText("See All");
    expect(seeAllLinks).toHaveLength(1);
    expect(seeAllLinks[0].className).toContain("text-[#9CA3AF]");

    seeAllLinks[0].click();
    expect(navigateSpy).toHaveBeenCalledWith("/member/upcoming");
  });

  it("shows only Payment History's See All when it has data but Upcoming Payments doesn't", () => {
    mockPayments({
      upcoming: [],
      history: [{ id: "h1", description: "School Fees Support", date: "2026-05-01", amount: 24000, status: "success" }],
    });
    renderHome();

    expect(screen.getByText("No Upcoming Payments")).toBeDefined();
    const seeAllLinks = screen.getAllByText("See All");
    expect(seeAllLinks).toHaveLength(1);
    expect(seeAllLinks[0].className).toContain("text-[#9CA3AF]");

    seeAllLinks[0].click();
    expect(navigateSpy).toHaveBeenCalledWith("/member/transactions");
  });
});
