import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../../store/AuthContext";

// profileImage.url is server-supplied and reaches <img src> in Topbar,
// NotificationsPanel, NotificationsSections and memberApp Notifications. This
// pins the AuthContext boundary: the URL is normalized on the network path AND
// on the localStorage rehydration path, so neither a hostile API response nor a
// persisted/tampered value can become active user state.

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

const EVIL = "javascript:alert(document.domain)";
const GOOD = "https://res.cloudinary.com/demo/image/upload/me.png";

function Probe() {
  const { user, loading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="avatarSrc">{user?.profileImage?.url ?? "none"}</div>
      <div data-testid="avatarId">{user?.profileImage?.id ?? "none"}</div>
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

// A successful /user/me hydration response carrying the given profileImage.
function mockMeWithProfileImage(profileImage) {
  getMe.mockResolvedValue({
    data: {
      data: {
        id: "u1",
        email: "a@b.c",
        platformRole: "USER",
        userData: { firstName: "Ada", lastName: "L", profileImage },
      },
    },
  });
  client.get.mockResolvedValue({ data: { data: { content: [] } } });
}

describe("AuthContext profileImage URL normalization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("rejects a javascript: profile image coming from the API", async () => {
    mockMeWithProfileImage({ url: EVIL });
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("avatarSrc").textContent).toBe("none");
  });

  it("preserves a valid https profile image from the API", async () => {
    mockMeWithProfileImage({ url: GOOD, id: 7 });
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("avatarSrc").textContent).toBe(GOOD));
    // Unrelated fields on the image object are preserved.
    expect(screen.getByTestId("avatarId").textContent).toBe("7");
  });

  it("rejects a malformed/control-character profile image URL", async () => {
    mockMeWithProfileImage({ url: "java\tscript:alert(1)" });
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("avatarSrc").textContent).toBe("none");
  });

  it("tolerates a missing profile image entirely", async () => {
    mockMeWithProfileImage(undefined);
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("avatarSrc").textContent).toBe("none");
  });

  it("does not persist a rejected URL — the stored user is already normalized", async () => {
    mockMeWithProfileImage({ url: EVIL });
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1" }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    const stored = JSON.parse(localStorage.getItem("glass_user") ?? "{}");
    expect(stored.profileImage?.url).toBeNull();
  });

  it("normalizes a poisoned persisted user on rehydration", async () => {
    // Restoration hydrates from localStorage BEFORE the network refresh
    // completes, so an unsanitized stored value would otherwise reach first
    // paint. The refresh below hangs, isolating the rehydration behaviour.
    getMe.mockImplementation(() => new Promise(() => {}));
    client.get.mockImplementation(() => new Promise(() => {}));
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1", profileImage: { url: EVIL } }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("avatarSrc").textContent).toBe("none"));
    expect(screen.getByTestId("avatarSrc").textContent).not.toContain("javascript:");
  });

  it("rewrites a poisoned persisted user back to the normalized representation", async () => {
    // Normalizing only the React state would leave the stored value poisoned on
    // disk: it would keep being read on every later mount, and any other reader
    // of glass_user would still see the raw URL. The restore path must
    // therefore persist what it normalizes.
    getMe.mockImplementation(() => new Promise(() => {}));
    client.get.mockImplementation(() => new Promise(() => {}));
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1", profileImage: { url: EVIL } }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("avatarSrc").textContent).toBe("none"));

    const stored = JSON.parse(localStorage.getItem("glass_user") ?? "{}");
    expect(stored.profileImage.url).toBeNull();
    expect(localStorage.getItem("glass_user")).not.toContain("javascript:");
    // Unrelated user fields survive the rewrite.
    expect(stored.id).toBe("u1");
  });

  it("leaves an already-valid persisted user untouched, with no needless rewrite", async () => {
    getMe.mockImplementation(() => new Promise(() => {}));
    client.get.mockImplementation(() => new Promise(() => {}));
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    const before = JSON.stringify({ id: "u1", role: "USER", profileImage: { url: GOOD, id: 5 } });
    localStorage.setItem("glass_user", before);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("avatarSrc").textContent).toBe(GOOD));
    // Byte-identical: normalization produced no change, so no write happened.
    expect(localStorage.getItem("glass_user")).toBe(before);
    expect(screen.getByTestId("avatarId").textContent).toBe("5");
  });

  it("keeps a valid persisted profile image through rehydration", async () => {
    getMe.mockImplementation(() => new Promise(() => {}));
    client.get.mockImplementation(() => new Promise(() => {}));
    localStorage.setItem("accessToken", "t");
    localStorage.setItem("refreshToken", "rt");
    localStorage.setItem("glass_user", JSON.stringify({ id: "u1", profileImage: { url: GOOD } }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("avatarSrc").textContent).toBe(GOOD));
  });
});
