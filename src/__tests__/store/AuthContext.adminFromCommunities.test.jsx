import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../../store/AuthContext";

// Regression guard for a real lockout: AuthContext derived `user.isAdmin` from
// the FIRST page of GET /communities/me, which defaults to 10 communities. An
// admin whose one administered community sorted past row 10 resolved
// isAdmin: false, and ProtectedRoute turns that into a redirect away from every
// admin-gated route -- locking a legitimate community admin out of the dashboard
// with no route in.
//
// Both derivation paths are covered, because there are two and they were
// separate code:
//   - buildUser()              -> login() / setSession()
//   - hydrateUserProfile()     -> restore() on mount / refreshUser()
//
// Mocked at api/client, NOT at the hook or the api module: communityList.js's
// page walk is the code under test here, so stubbing it would hide exactly the
// wiring that broke.
vi.mock("../../api/members", () => ({ getMe: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual = await vi.importActual("../../api/client");
  return { ...actual, default: { ...(actual.default ?? {}), get: vi.fn() } };
});
// The login POST itself is not what's under test -- the isAdmin derivation that
// runs after it. Stubbed so the buildUser path can be exercised without a
// network call; storeAuthSession's real side effect (writing the session keys)
// is preserved because logout/fail-closed tests elsewhere depend on those keys
// actually being written.
vi.mock("../../services/authService", async () => {
  const actual = await vi.importActual("../../services/authService");
  return {
    ...actual,
    login: vi.fn(async () => ({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      userId: "u1",
      email: "a@b.c",
      platformRole: "USER",
      emailVerified: true,
    })),
  };
});

import { getMe } from "../../api/members";
import client from "../../api/client";
import { login as apiLogin } from "../../services/authService";

const OWNED = { id: "c-owned", slug: "owned", name: "Owned", owned: true };
const MEMBER_ONLY = {
  id: "c-member",
  slug: "member",
  name: "Member",
  owned: false,
  memberRole: "COMMUNITY_MEMBER",
};

function Probe() {
  const { user, isAdmin, loading, sessionVerified, token, login, refreshUser } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="verified">{String(sessionVerified)}</div>
      <div data-testid="isAdmin">{String(isAdmin)}</div>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="user">{JSON.stringify(user ?? null)}</div>
      <button
        type="button"
        data-testid="login"
        onClick={() => login({ email: "a@b.c", password: "pw" })}
      >
        login
      </button>
      <button type="button" data-testid="refresh" onClick={() => refreshUser()}>
        refresh
      </button>
    </div>
  );
}

function renderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

// A page of the backend's PageResponse envelope.
function page({ content, pageNumber, totalElements, totalPages, last }) {
  return { content, pageNumber, pageSize: 10, totalElements, totalPages, last };
}

/**
 * Serve /communities/me as the backend would: a fixed-size page of a larger
 * collection, ordered newest-first by createdAt. Paginates by slicing, so
 * "page 2" genuinely holds different rows than "page 1".
 */
function serveCommunities(all, pageSize = 10) {
  const totalElements = all.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  return vi.fn(async (_url, config) => {
    const requested = config?.params?.pageNumber;
    const pn = typeof requested === "number" ? requested : 1;
    const start = (pn - 1) * pageSize;
    const slice = all.slice(start, start + pageSize);
    return {
      data: {
        data: page({
          content: slice,
          pageNumber: pn,
          totalElements,
          totalPages,
          last: pn >= totalPages,
        }),
      },
    };
  });
}

function communityRequests() {
  return client.get.mock.calls.filter(([url]) => url === "/communities/me");
}

function requestedPageNumbers() {
  return communityRequests().map(([, config]) => config?.params?.pageNumber);
}

// restore() path: a stored token makes the provider hydrate on mount.
function seedStoredSession() {
  localStorage.setItem("accessToken", "stored-token");
  localStorage.setItem("refreshToken", "stored-refresh");
  localStorage.setItem("glass_user", JSON.stringify({ id: "u1", email: "a@b.c", role: "USER" }));
}

function stubProfile(platformRole = "USER") {
  getMe.mockResolvedValue({ data: { data: { id: "u1", email: "a@b.c", platformRole } } });
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  // Default stub so no test leaves getMe() returning undefined. login() sets a
  // token, which fires the post-restore token-change effect -> a second
  // hydrateUserProfile() -> fetchHydrationOnce() -> getMe(). An unstubbed getMe
  // resolves to undefined and AuthContext then reads `meRes.data`, producing an
  // unhandled rejection that has nothing to do with the derivation under test.
  // Tests that care about the profile override this via stubProfile().
  getMe.mockResolvedValue({ data: { data: { id: "u1", email: "a@b.c", platformRole: "USER" } } });
});

describe("AuthContext admin derivation — hydrateUserProfile / restore path", () => {
  it("isAdmin true when the administered community is on page 1", async () => {
    seedStoredSession();
    stubProfile();
    client.get.mockImplementation(serveCommunities([OWNED, MEMBER_ONLY]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(communityRequests()).toHaveLength(1);
  });

  it("isAdmin true when the administered community is ONLY on page 2", async () => {
    seedStoredSession();
    stubProfile();
    // 10 member-only rows ahead of the admin community, so it lands on page 2.
    const filler = Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    // This is the regression: page 1 alone has no admin community.
    expect(communityRequests()).toHaveLength(2);
    expect(requestedPageNumbers()).toEqual([1, 2]);
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
  });

  it("isAdmin true when the administered community is on a much later page", async () => {
    seedStoredSession();
    stubProfile();
    const filler = Array.from({ length: 34 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    // 35 communities at 10/page = 4 pages; proves the walk goes past page 2.
    expect(requestedPageNumbers()).toEqual([1, 2, 3, 4]);
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
  });

  it("isAdmin false for a plain member across several pages", async () => {
    seedStoredSession();
    stubProfile();
    const many = Array.from({ length: 23 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities(many));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    // Still walks the whole list rather than stopping at page 1 -- completeness
    // is the point, so a promoted admin on page 3 is not missed either.
    expect(requestedPageNumbers()).toEqual([1, 2, 3]);
  });

  it("platform admin stays isAdmin true with no communities at all", async () => {
    seedStoredSession();
    stubProfile("SUPER_ADMIN");
    client.get.mockImplementation(serveCommunities([]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(communityRequests()).toHaveLength(1);
  });

  it("empty community list does not throw and yields isAdmin false for a USER", async () => {
    seedStoredSession();
    stubProfile();
    client.get.mockImplementation(serveCommunities([]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("verified").textContent).toBe("true");
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(communityRequests()).toHaveLength(1);
  });

  it("empty list reporting totalPages 0 terminates after one request", async () => {
    seedStoredSession();
    stubProfile();
    client.get.mockImplementation(async () => ({
      data: {
        data: page({ content: [], pageNumber: 1, totalElements: 0, totalPages: 0, last: true }),
      },
    }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(communityRequests()).toHaveLength(1);
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
  });

  it("persists the derived isAdmin onto glass_user", async () => {
    seedStoredSession();
    stubProfile();
    const filler = Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    const stored = JSON.parse(localStorage.getItem("glass_user"));
    expect(stored.isAdmin).toBe(true);
  });
});

describe("AuthContext admin derivation — buildUser / login path", () => {
  // login() clears the query cache then awaits buildUser(), which re-derives
  // isAdmin. This path shares the same complete-list helper.
  it("isAdmin true when the administered community is only on page 2", async () => {
    const filler = Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      await screen.getByTestId("login").click();
    });

    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));
    // login() awaits buildUser(), which runs the walk; the resulting token
    // change then triggers hydrateUserProfile() for the same list, so the log
    // holds two walks of [1, 2]. What matters is that every walk reached page
    // 2 and none started at 0.
    expect(requestedPageNumbers()).toContain(2);
    expect(requestedPageNumbers()).not.toContain(0);
    expect(requestedPageNumbers()[0]).toBe(1);
    const user = JSON.parse(screen.getByTestId("user").textContent);
    expect(user.isAdmin).toBe(true);
  });

  it("isAdmin false for a member-only account spanning pages", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities(many));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      await screen.getByTestId("login").click();
    });

    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("false"));
    const user = JSON.parse(screen.getByTestId("user").textContent);
    expect(user.isAdmin).toBe(false);
  });

  it("platform admin stays isAdmin true when the community lookup returns nothing", async () => {
    apiLogin.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      userId: "u1",
      email: "a@b.c",
      platformRole: "SUPER_ADMIN",
      emailVerified: true,
    });
    client.get.mockRejectedValue(new Error("communities unavailable"));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await act(async () => {
      await screen.getByTestId("login").click();
    });

    // Existing fail-open-for-platform-admin behavior must survive: the
    // communities call failing does not strip a platform admin of access.
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));
  });
});

describe("AuthContext admin derivation — pagination correctness", () => {
  it("never sends pageNumber 0 and starts at 1", async () => {
    seedStoredSession();
    stubProfile();
    const filler = Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(requestedPageNumbers()).not.toContain(0);
    expect(requestedPageNumbers()[0]).toBe(1);
  });

  it("fetches pages sequentially, never concurrently", async () => {
    seedStoredSession();
    stubProfile();
    // 25 communities at 10/page = 3 pages.
    const filler = Array.from({ length: 24 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));

    let inFlight = 0;
    let maxConcurrent = 0;
    const base = serveCommunities([...filler, OWNED]);
    client.get.mockImplementation(async (url, config) => {
      inFlight += 1;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return base(url, config);
    });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    expect(requestedPageNumbers()).toEqual([1, 2, 3]);
    expect(maxConcurrent).toBe(1);
  });

  it("requests no page twice", async () => {
    seedStoredSession();
    stubProfile();
    const filler = Array.from({ length: 24 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    const pages = requestedPageNumbers();
    expect(new Set(pages).size).toBe(pages.length);
  });

  it("requests COMMUNITY_PAGE_SIZE, and nothing beyond pageNumber, on the bootstrap fetch", async () => {
    // Bootstrap reads this list and blocks first paint on it, so the round
    // trips matter most here: 200 rows instead of the 10-row default.
    // pageNumber must still be the only thing the walk adds on its own — this
    // asserts the request carries nothing else the caller did not ask for.
    seedStoredSession();
    stubProfile();
    client.get.mockImplementation(serveCommunities([OWNED]));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    const params = communityRequests()[0][1].params;
    expect(params.pageSize).toBe(200);
    expect(params).toEqual({ pageSize: 200, pageNumber: 1 });
  });

  it("fails restore closed when a later page rejects", async () => {
    seedStoredSession();
    stubProfile();
    client.get.mockImplementation(async (_url, config) => {
      const pn = config?.params?.pageNumber ?? 1;
      if (pn === 1) {
        return {
          data: {
            data: page({
              content: [MEMBER_ONLY],
              pageNumber: 1,
              totalElements: 2,
              totalPages: 2,
              last: false,
            }),
          },
        };
      }
      throw new Error("page 2 failed");
    });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    // Same fail-closed outcome as any hydration failure.
    expect(screen.getByTestId("verified").textContent).toBe("false");
    expect(screen.getByTestId("token").textContent).toBe("none");
  });
});

describe("AuthContext session lifecycle — unchanged by the complete-list swap", () => {
  it("still clears the query cache on an external session end", async () => {
    seedStoredSession();
    stubProfile();
    client.get.mockImplementation(serveCommunities([OWNED]));

    const { queryClient } = renderAuth();
    queryClient.setQueryData(["probe"], { stale: true });

    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));

    localStorage.removeItem("accessToken");
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "accessToken", newValue: null }));
    });

    await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("none"));
    expect(queryClient.getQueryData(["probe"])).toBeUndefined();
  });

  it("hydration is single-flight: concurrent refreshes share one walk", async () => {
    seedStoredSession();
    stubProfile();
    const filler = Array.from({ length: 10 }, (_, i) => ({
      id: `c-${i}`,
      slug: `c-${i}`,
      name: `C${i}`,
      owned: false,
      memberRole: "COMMUNITY_MEMBER",
    }));
    client.get.mockImplementation(serveCommunities([...filler, OWNED]));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("verified").textContent).toBe("true"));
    const afterRestore = communityRequests().length;

    // Two overlapping refreshes must not each start their own walk.
    await act(async () => {
      await Promise.all([
        screen.getByTestId("refresh").click(),
        screen.getByTestId("refresh").click(),
      ]);
    });
    await new Promise((r) => setTimeout(r, 50));

    // The 2-page walk ran once for restore; overlapping refreshes share the
    // same single-flight promise rather than doubling it.
    expect(communityRequests().length).toBeLessThanOrEqual(afterRestore + 2);
  });
});
