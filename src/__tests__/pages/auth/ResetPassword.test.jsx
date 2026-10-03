import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ResetPassword from "../../../pages/auth/ResetPassword";
import { resetPassword } from "../../../services/authService";
import { clearSessionStorage } from "../../../store/sessionStorage";

// Shared by /reset-password and /member/reset-password. Covers the four
// behaviors that matter here: the invalid/missing-link state, client-side
// validation, the successful reset + redirect, and a server rejection (the
// expired-token case) staying inline instead of advancing.
//
// Credentials arrive in sessionStorage (written by ForgotPassword), not the URL
// — see that page for why. The lifecycle those two pages share is:
//   write on OTP verification -> read into React state once on mount -> the
//   token survives re-renders and a page refresh -> consumed on submit.
vi.mock("../../../services/authService", () => ({
  resetPassword: vi.fn(),
}));

const VALID_PASSWORD = "Glass123!";
const RESET_KEY = "glass_reset_otp";

function renderReset({ seed = true, entry = "/reset-password" } = {}) {
  if (seed) {
    sessionStorage.setItem(
      RESET_KEY,
      JSON.stringify({ email: "sulaimon@example.com", token: "reset-token-1" }),
    );
  }
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/sign-in" element={<div data-testid="sign-in-page" />} />
        <Route path="/forgot-password" element={<div data-testid="forgot-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillPasswords(newPassword, confirmPassword) {
  fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
    target: { value: newPassword },
  });
  fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), {
    target: { value: confirmPassword },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Reset Password|Resetting/ }));
}

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("ResetPassword credential loading", () => {
  it("renders the form on the very first paint — there is no invalid-link flash", () => {
    // sessionStorage.getItem is synchronous, so a lazy useState initializer has
    // the credentials before the first render. This asserts that with a server
    // render, which cannot be preceded by an effect or a state update: the form
    // is present and the invalid-link message never appears.
    sessionStorage.setItem(
      RESET_KEY,
      JSON.stringify({ email: "sulaimon@example.com", token: "reset-token-1" }),
    );
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain("Enter new password");
    expect(html).not.toContain("This reset link is invalid or has expired.");
  });

  it("shows the invalid-link state on first paint when nothing is stored", () => {
    // The counterpart: with no stored credentials the decision is immediate
    // and correct, not delayed by a loading frame.
    sessionStorage.removeItem(RESET_KEY);
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain("This reset link is invalid or has expired.");
    expect(html).not.toContain("Enter new password");
  });

  it("never shows the invalid-link message for a valid link", () => {
    renderReset();

    expect(screen.queryByText(/This reset link is invalid or has expired\./)).toBeNull();
  });

  it("renders the form once the stored credentials are read", async () => {
    renderReset();

    expect(await screen.findByPlaceholderText("Enter new password")).toBeDefined();
    expect(screen.queryByText(/This reset link is invalid or has expired\./)).toBeNull();
  });

  it("ignores email/token query params — only sessionStorage counts now", async () => {
    // Regression guard against reintroducing the URL as a credential source.
    renderReset({ entry: "/reset-password?email=attacker@example.com&token=leaked" });

    await screen.findByPlaceholderText("Enter new password");
    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    submit();

    expect(resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: "sulaimon@example.com", token: "reset-token-1" }),
    );
  });
});

describe("ResetPassword without a usable link", () => {
  it("shows the invalid-link state instead of the form when sessionStorage has no reset data", async () => {
    // No seed: someone navigated straight to /reset-password, or the tab was
    // opened fresh and sessionStorage is empty.
    renderReset({ seed: false });

    expect(await screen.findByText(/This reset link is invalid or has expired\./)).toBeDefined();
    expect(screen.queryByPlaceholderText("Enter new password")).toBeNull();
    // Offers the recovery path back to a fresh request.
    expect(screen.getByRole("link", { name: "Request a new one" }).getAttribute("href")).toBe(
      "/forgot-password",
    );
  });

  it("treats unparseable stored data as an unusable link rather than throwing", async () => {
    sessionStorage.setItem(RESET_KEY, "not-json");
    renderReset({ seed: false });

    expect(await screen.findByText(/This reset link is invalid or has expired\./)).toBeDefined();
  });

  it("treats stored data missing a token as an unusable link", async () => {
    sessionStorage.setItem(RESET_KEY, JSON.stringify({ email: "sulaimon@example.com" }));
    renderReset({ seed: false });

    expect(await screen.findByText(/This reset link is invalid or has expired\./)).toBeDefined();
  });
});

describe("ResetPassword token lifecycle", () => {
  it("a keystroke does not make a valid link look invalid", async () => {
    // This is the bug the read-once-into-state design exists to prevent: if the
    // key were consumed during render, the second render would find nothing.
    renderReset();
    await screen.findByPlaceholderText("Enter new password");

    fillPasswords("Glass123!x", "Glass123!y");

    expect(screen.queryByText(/This reset link is invalid or has expired\./)).toBeNull();
    expect(screen.getByPlaceholderText("Enter new password")).toBeDefined();
  });

  it("keeps the token in storage until the reset is actually submitted", async () => {
    renderReset();
    await screen.findByPlaceholderText("Enter new password");

    // Typing and blurring must not consume it.
    fillPasswords("weakpw", "weakpw");
    submit();
    expect(resetPassword).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(RESET_KEY)).not.toBeNull();
  });

  it("removes the token from sessionStorage on a successful reset", async () => {
    renderReset();
    await screen.findByPlaceholderText("Enter new password");
    resetPassword.mockResolvedValue({});

    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    submit();

    await screen.findByTestId("sign-in-page");
    expect(sessionStorage.getItem(RESET_KEY)).toBeNull();
  });

  it("a later user on the same tab cannot inherit a token cleared by session end", async () => {
    // The cross-account case, end to end: a reset is requested, the session
    // ends before it is completed, and whoever uses the tab next must not find
    // the previous user's token sitting in sessionStorage. This is why the key
    // is in SESSION_TRANSIENT_KEYS and not merely left to the tab's lifetime.
    sessionStorage.setItem(
      RESET_KEY,
      JSON.stringify({ email: "first-user@example.com", token: "first-users-token" }),
    );
    const first = renderReset({ seed: false });
    await screen.findByPlaceholderText("Enter new password");
    first.unmount();

    // Session ends — logout, an unrecoverable 401, or a cross-tab sign-out.
    clearSessionStorage();
    expect(sessionStorage.getItem(RESET_KEY)).toBeNull();

    // Second user opens the same route in the same tab.
    renderReset({ seed: false });
    expect(await screen.findByText(/This reset link is invalid or has expired\./)).toBeDefined();
    expect(screen.queryByPlaceholderText("Enter new password")).toBeNull();
  });

  it("still has the token available after a re-render that precedes submission", async () => {
    // The refresh case: storage is the durable copy, React state is only the
    // working copy. Tearing the component down and mounting it again is what a
    // browser refresh does to both.
    const first = renderReset();
    await screen.findByPlaceholderText("Enter new password");
    first.unmount();

    expect(sessionStorage.getItem(RESET_KEY)).not.toBeNull();

    renderReset({ seed: false });
    expect(await screen.findByPlaceholderText("Enter new password")).toBeDefined();
    expect(screen.queryByText(/This reset link is invalid or has expired\./)).toBeNull();
  });
});

describe("ResetPassword form", () => {
  it("rejects a weak password client-side without calling the service", () => {
    renderReset();

    fillPasswords("weakpw", "weakpw");
    submit();

    // Like RegisterStep, the password rule has no inline message element
    // (only the live checklist) — the field is flagged invalid and submit
    // never reaches the service.
    expect(screen.getByPlaceholderText("Enter new password").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("rejects a confirm value that doesn't match without calling the service", () => {
    renderReset();

    fillPasswords(VALID_PASSWORD, "Glass1234!");
    submit();

    expect(screen.getByText("Passwords don't match.")).toBeDefined();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("submits the full reset payload, shows loading, and redirects to sign-in", async () => {
    renderReset();
    const gate = deferred();
    resetPassword.mockReturnValue(gate.promise);

    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    submit();

    expect(screen.getByText("Resetting...")).toBeDefined();

    gate.resolve({});
    expect(await screen.findByTestId("sign-in-page")).toBeDefined();
    expect(resetPassword).toHaveBeenCalledWith({
      email: "sulaimon@example.com",
      token: "reset-token-1",
      newPassword: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });
  });

  it("keeps the form in place and explains a server-side rejection (expired token)", async () => {
    renderReset();
    resetPassword.mockRejectedValue({
      response: { status: 400, data: { message: "Reset link has expired" } },
    });

    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    submit();

    expect(await screen.findByText("Reset link has expired")).toBeDefined();
    expect(screen.queryByTestId("sign-in-page")).toBeNull();
    expect(screen.getByPlaceholderText("Enter new password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Reset Password" }).disabled).toBe(false);
  });
});
