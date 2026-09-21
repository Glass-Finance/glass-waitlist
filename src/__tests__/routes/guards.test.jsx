import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../routes/ProtectedRoute";
import MemberProtectedRoute from "../../routes/MemberProtectedRoute";
import PlatformAdminRoute from "../../routes/PlatformAdminRoute";
import CommunityAdminGuard from "../../routes/CommunityAdminGuard";
import { useAuth } from "../../store/AuthContext";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { useCommunities } from "../../hooks/useCommunities";

// testing-strategy.md names "broader route-guard coverage" as a known gap.
// CommunityAdminGuard specifically exists to close a real cross-tenant
// security hole (a Community Admin of community A editing the URL to
// ?community=B and reaching B's data) -- its own code comment documents
// this explicitly, and it has a subtle isLoading-vs-isFetching distinction
// that exists specifically to not regress the onboarding flow while fixing
// that hole. This is exactly the kind of logic that should have a test
// pinning both halves of that tradeoff, not just the happy path.

vi.mock("../../store/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: vi.fn(),
}));
vi.mock("../../hooks/useCommunities", () => ({
  useCommunities: vi.fn(),
}));

function renderGuarded(guardElement, { initialPath = "/protected" } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={guardElement}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
        <Route path="/sign-in" element={<div>Sign-in page</div>} />
        <Route path="/member/app-sign-in" element={<div>Member sign-in page</div>} />
        <Route path="/member/home" element={<div>Member home</div>} />
        <Route path="/dashboard/home" element={<div>Dashboard home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading screen while auth is still resolving, without redirecting yet", () => {
    useAuth.mockReturnValue({ token: null, isAdmin: false, isMember: false, loading: true });
    renderGuarded(<ProtectedRoute requiredRole="admin" />);

    expect(screen.queryByText("Protected content")).toBeNull();
    expect(screen.queryByText("Sign-in page")).toBeNull();
  });

  it("redirects to sign-in when there is no token", () => {
    useAuth.mockReturnValue({ token: null, isAdmin: false, isMember: false, loading: false });
    renderGuarded(<ProtectedRoute requiredRole="admin" />);

    screen.getByText("Sign-in page");
  });

  it("redirects a non-admin away from an admin-required route, to the member app instead of sign-in", () => {
    useAuth.mockReturnValue({
      token: "tok",
      sessionVerified: true,
      isAdmin: false,
      isMember: true,
      loading: false,
    });
    renderGuarded(<ProtectedRoute requiredRole="admin" />);

    screen.getByText("Member home");
  });

  it("lets an authenticated admin through to an admin-required route", () => {
    useAuth.mockReturnValue({
      token: "tok",
      sessionVerified: true,
      isAdmin: true,
      isMember: false,
      loading: false,
    });
    renderGuarded(<ProtectedRoute requiredRole="admin" />);

    screen.getByText("Protected content");
  });

  it("redirects a non-member away from a member-required route, to the dashboard instead of sign-in", () => {
    useAuth.mockReturnValue({
      token: "tok",
      sessionVerified: true,
      isAdmin: true,
      isMember: false,
      loading: false,
    });
    renderGuarded(<ProtectedRoute requiredRole="member" />);

    screen.getByText("Dashboard home");
  });

  it("lets an authenticated user through when no specific role is required", () => {
    useAuth.mockReturnValue({
      token: "tok",
      sessionVerified: true,
      isAdmin: false,
      isMember: true,
      loading: false,
    });
    renderGuarded(<ProtectedRoute />);

    screen.getByText("Protected content");
  });

  it("redirects to sign-in when a token is present but the session was never verified (expired/stale cache)", () => {
    useAuth.mockReturnValue({
      token: "tok",
      sessionVerified: false,
      isAdmin: true,
      isMember: false,
      loading: false,
    });
    renderGuarded(<ProtectedRoute requiredRole="admin" />);

    screen.getByText("Sign-in page");
    expect(screen.queryByText("Protected content")).toBeNull();
  });
});

describe("MemberProtectedRoute", () => {
  it("redirects to the member-app sign-in (not the admin one) when there is no token", () => {
    useAuth.mockReturnValue({ token: null, loading: false });
    renderGuarded(<MemberProtectedRoute />);

    screen.getByText("Member sign-in page");
  });

  it("lets any authenticated user through, admin or not -- community admins can also be paying members", () => {
    useAuth.mockReturnValue({ token: "tok", sessionVerified: true, loading: false });
    renderGuarded(<MemberProtectedRoute />);

    screen.getByText("Protected content");
  });

  it("redirects to member sign-in when a token is present but the session was never verified", () => {
    useAuth.mockReturnValue({ token: "tok", sessionVerified: false, loading: false });
    renderGuarded(<MemberProtectedRoute />);

    screen.getByText("Member sign-in page");
    expect(screen.queryByText("Protected content")).toBeNull();
  });
});

describe("PlatformAdminRoute", () => {
  it("redirects to the dashboard when there is no token", () => {
    useAuth.mockReturnValue({ token: null, user: null, isPlatformAdmin: false, loading: false });
    renderGuarded(<PlatformAdminRoute />);

    screen.getByText("Dashboard home");
  });

  it("redirects a logged-in non-platform-admin to the dashboard, not sign-in", () => {
    useAuth.mockReturnValue({
      token: "tok",
      user: { id: "u1" },
      sessionVerified: true,
      isPlatformAdmin: false,
      loading: false,
    });
    renderGuarded(<PlatformAdminRoute />);

    screen.getByText("Dashboard home");
  });

  it("lets an authenticated platform admin through", () => {
    useAuth.mockReturnValue({
      token: "tok",
      user: { id: "u1" },
      sessionVerified: true,
      isPlatformAdmin: true,
      loading: false,
    });
    renderGuarded(<PlatformAdminRoute />);

    screen.getByText("Protected content");
  });

  it("redirects to the dashboard when the session was never verified, even for a platform admin", () => {
    useAuth.mockReturnValue({
      token: "tok",
      user: { id: "u1" },
      sessionVerified: false,
      isPlatformAdmin: true,
      loading: false,
    });
    renderGuarded(<PlatformAdminRoute />);

    screen.getByText("Dashboard home");
    expect(screen.queryByText("Protected content")).toBeNull();
  });
});

describe("CommunityAdminGuard -- the cross-tenant access boundary", () => {
  beforeEach(() => {
    useActiveCommunityId.mockReturnValue("comm-B");
  });

  it("fails closed when no community is resolved yet -- redirects to the community list instead of rendering through", () => {
    useActiveCommunityId.mockReturnValue(null);
    useCommunities.mockReturnValue({ data: undefined, isLoading: false, isFetching: false });
    renderGuarded(<CommunityAdminGuard />);

    screen.getByText("Dashboard home");
    expect(screen.queryByText("Protected content")).toBeNull();
  });

  it("shows a loading screen on the very first fetch, without redirecting yet", () => {
    useCommunities.mockReturnValue({ data: undefined, isLoading: true, isFetching: true });
    renderGuarded(<CommunityAdminGuard />);

    expect(screen.queryByText("Protected content")).toBeNull();
    expect(screen.queryByText("Dashboard home")).toBeNull();
  });

  it("blocks an admin of community A from reaching community B via a manipulated ?community= id -- the actual security boundary this guard exists for", () => {
    useCommunities.mockReturnValue({
      data: { communities: [{ id: "comm-A", slug: "comm-A", owned: true }] },
      isLoading: false,
      isFetching: false,
    });
    renderGuarded(<CommunityAdminGuard />); // useActiveCommunityId is stubbed to "comm-B" above

    screen.getByText("Dashboard home");
    expect(screen.queryByText("Protected content")).toBeNull();
  });

  it("lets an actual owner/admin/manager of the active community through", () => {
    useActiveCommunityId.mockReturnValue("comm-A");
    useCommunities.mockReturnValue({
      data: { communities: [{ id: "comm-A", slug: "comm-A", owned: true }] },
      isLoading: false,
      isFetching: false,
    });
    renderGuarded(<CommunityAdminGuard />);

    screen.getByText("Protected content");
  });

  it("blocks a plain member (not owner/admin/manager) of the active community", () => {
    useActiveCommunityId.mockReturnValue("comm-A");
    useCommunities.mockReturnValue({
      data: { communities: [{ id: "comm-A", slug: "comm-A", owned: false, memberRole: "MEMBER" }] },
      isLoading: false,
      isFetching: false,
    });
    renderGuarded(<CommunityAdminGuard />);

    screen.getByText("Dashboard home");
  });

  it("waits for a background refetch rather than bouncing a freshly-created community's own admin (the isLoading-vs-isFetching distinction)", () => {
    // Not found in the cached list yet, but a refetch is in flight -- this
    // is the exact scenario right after onboarding creates a community and
    // the list hasn't caught up. Must NOT redirect here.
    useActiveCommunityId.mockReturnValue("brand-new-comm");
    useCommunities.mockReturnValue({
      data: { communities: [] },
      isLoading: false,
      isFetching: true,
    });
    renderGuarded(<CommunityAdminGuard />);

    expect(screen.queryByText("Dashboard home")).toBeNull();
    expect(screen.queryByText("Protected content")).toBeNull();
  });

  it("once the refetch settles and the community genuinely isn't found, redirects rather than waiting forever", () => {
    useActiveCommunityId.mockReturnValue("nonexistent-comm");
    useCommunities.mockReturnValue({
      data: { communities: [] },
      isLoading: false,
      isFetching: false,
    });
    renderGuarded(<CommunityAdminGuard />);

    screen.getByText("Dashboard home");
  });
});
