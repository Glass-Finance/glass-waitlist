import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Join from "../../../../pages/auth/member/Join";
import { useAuth } from "../../../../store/AuthContext";
import { INVITE_TOKEN_KEY } from "../../../../hooks/useInviteToken";
import { register } from "../../../../services/authService";

vi.mock("../../../../store/AuthContext", () => ({ useAuth: vi.fn() }));

vi.mock("../../../../services/authService", () => ({
  requestLoginOtp: vi.fn(() => new Promise(() => {})),
  register: vi.fn(),
  isEmailAlreadyRegisteredError: vi.fn(() => false),
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

// Stand-in for the real Google button. The success trigger mirrors
// GoogleAuthButton's success path (setSession + onAuthenticated callback);
// the failure trigger mirrors its failure path, which only surfaces an
// error notification and never calls onAuthenticated (or touches tokens).
vi.mock("../../../../components/auth/GoogleAuthButton", () => ({
  default: ({ onAuthenticated }) => (
    <>
      <button data-testid="google-success-stub" onClick={() => onAuthenticated({ id: "u1" })}>
        Google
      </button>
      <button data-testid="google-failure-stub" onClick={() => {}}>
        Google fails
      </button>
    </>
  ),
}));

function renderJoin(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Join />
    </MemoryRouter>,
  );
}

describe("Join Google + invite token lifecycle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    navigateMock.mockClear();
    useAuth.mockReturnValue({
      setSession: vi.fn(async (authData) => ({ id: "u1", ...authData })),
      storeSessionIfPresent: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it("preserves the invite token through a successful Google auth and routes to manual accept", async () => {
    renderJoin("/member/join?token=abc123");

    await act(async () => {
      fireEvent.click(screen.getByTestId("google-success-stub"));
    });

    // Fallback flow continues (backend has no Google+invite support)…
    expect(navigateMock).toHaveBeenCalledWith("/member/invites", { replace: true });
    // …without touching the register endpoint at all, so the invite token
    // can never leak onto a wire that has no field for it.
    expect(register).not.toHaveBeenCalled();
    // …but the token is no longer consumed before the round-trip, so a
    // failure or retry never loses the invite context.
    expect(sessionStorage.getItem(INVITE_TOKEN_KEY)).toBe("abc123");
  });

  it("keeps the invite token when the Google attempt fails", async () => {
    renderJoin("/member/join?token=abc123");

    await act(async () => {
      fireEvent.click(screen.getByTestId("google-failure-stub"));
    });

    // No navigation, no consumption — the user can retry Google or use the
    // regular register flow with the token still intact.
    expect(navigateMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(INVITE_TOKEN_KEY)).toBe("abc123");
  });

  it("keeps the invite token when the Google popup is dismissed without choosing", async () => {
    renderJoin("/member/join?token=abc123");

    // Dismissal fires no callback at all (same as the real button: only a
    // returned credential reaches onAuthenticated).
    await act(async () => {
      await Promise.resolve();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(INVITE_TOKEN_KEY)).toBe("abc123");
  });
});
