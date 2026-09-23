import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ResetPassword from "../../../pages/auth/ResetPassword";
import { resetPassword } from "../../../services/authService";

// Shared by /reset-password and /member/reset-password. Covers the four
// behaviors that matter here: the invalid/missing-link state, client-side
// validation, the successful reset + redirect, and a server rejection (the
// expired-token case) staying inline instead of advancing.
vi.mock("../../../services/authService", () => ({
  resetPassword: vi.fn(),
}));

const VALID_PASSWORD = "Glass123!";

function renderReset(query = "?email=sulaimon%40example.com&token=reset-token-1") {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${query}`]}>
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
});

describe("ResetPassword without a usable link", () => {
  it("shows the invalid-link state instead of the form when email/token are missing", async () => {
    renderReset("");

    expect(await screen.findByText(/This reset link is invalid or has expired\./)).toBeDefined();
    expect(screen.queryByPlaceholderText("Enter new password")).toBeNull();
    // Offers the recovery path back to a fresh request.
    expect(screen.getByRole("link", { name: "Request a new one" }).getAttribute("href")).toBe(
      "/forgot-password",
    );
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
