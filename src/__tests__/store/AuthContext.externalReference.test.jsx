import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../../store/AuthContext";

// GET /user/me returns the account's stable `externalReference`
// (auth.users.external_user_reference) alongside the rest of UserDto. CrispChat
// passes it to Crisp.setTokenId() to bind a support conversation to the user.
//
// This pins the AuthContext boundary: the value reaches `user` from the network
// path AND survives a localStorage rehydration, because writeStoredUser
// serialises the whole user object — if the field were dropped from the mapping
// below it would silently vanish on reload and every returning visitor would
// get a fresh, unlinkable conversation.

vi.mock("../../api/members", () => ({ getMe: vi.fn() }));
vi.mock("../../api/client", async () => {
  const actual = await vi.importActual("../../api/client");
  return {
    ...actual,
    default: { ...(actual.default ?? {}), get: vi.fn() },
  };
});
vi.mock("../../services/authService", () => ({
  login: vi.fn(),
  googleLogin: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
}));

import { getMe } from "../../api/members";
import client from "../../api/client";

const REF = "0192f3c4-5d6e-7a8b-9c0d-1e2f3a4b5c6d";

function Probe() {
  const { user, loading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="ref">{user?.externalReference ?? "none"}</div>
    </div>
  );
}

function renderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

// A /me hydration response carrying the external reference. The backend nests it
// under the standard envelope (data.data) — same shape the real axios response has.
function mockMe(externalReference) {
  getMe.mockResolvedValue({
    data: {
      data: {
        id: "u1",
        email: "a@b.c",
        platformRole: "USER",
        externalReference,
        userData: { firstName: "Ada", lastName: "L" },
      },
    },
  });
  client.get.mockResolvedValue({ data: { data: { content: [] } } });
}

function signedIn() {
  localStorage.setItem("accessToken", "t");
  localStorage.setItem("refreshToken", "rt");
  localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));
}

describe("AuthContext external reference", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("maps the external reference from /me onto the current user", async () => {
    mockMe(REF);
    signedIn();

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("ref").textContent).toBe(REF);
  });

  it("persists the external reference so it survives a reload", async () => {
    mockMe(REF);
    signedIn();

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    const stored = JSON.parse(localStorage.getItem("glass_user") ?? "{}");
    expect(stored.externalReference).toBe(REF);
  });

  it("keeps the reference already held when a later /me omits it", async () => {
    // A partial/failed re-hydration must not downgrade a token we already hold:
    // losing it would silently unbind the Crisp session mid-visit.
    mockMe(undefined);
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1", externalReference: REF }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("ref").textContent).toBe(REF);
  });

  it("reports no reference for an anonymous visitor", async () => {
    getMe.mockRejectedValue(new Error("no session"));
    client.get.mockResolvedValue({ data: { data: { content: [] } } });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("ref").textContent).toBe("none");
  });
});
