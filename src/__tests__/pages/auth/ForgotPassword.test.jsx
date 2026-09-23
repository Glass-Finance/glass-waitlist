import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ForgotPassword from "../../../pages/auth/ForgotPassword";
import { forgotPassword } from "../../../services/authService";

// The two-step forgot-password flow (email → OTP → hand off to
// /reset-password with the code) was 0% covered off the baseline. The
// service is mocked at the module boundary per repo convention; validation
// and error mapping run through the real validators/errorHandler.
vi.mock("../../../services/authService", () => ({
  forgotPassword: vi.fn(),
}));

// Records the reset hand-off URL, including the encoded email + token query
// params that ResetPassword reads back.
function ResetTarget() {
  const location = useLocation();
  return <div data-testid="reset-target">{location.pathname + location.search}</div>;
}

function renderForgotPassword() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetTarget />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillEmail(value) {
  fireEvent.change(screen.getByPlaceholderText("e.g Bax**re@gmail.com"), {
    target: { value },
  });
}

function submitEmail() {
  fireEvent.click(screen.getByRole("button", { name: /Send Reset Code|Sending/ }));
}

function typeOtp(code) {
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: code } });
}

async function reachOtpStep() {
  forgotPassword.mockResolvedValue({});
  fillEmail("sulaimon@example.com");
  submitEmail();
  await screen.findByText("Enter Reset Code");
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

describe("ForgotPassword email step", () => {
  it("validates the email and never calls the service on an invalid address", () => {
    renderForgotPassword();

    fillEmail("bad@");
    submitEmail();

    expect(screen.getByText("Enter a valid email address.")).toBeDefined();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("shows loading while sending, then advances to the code step echoing the email", async () => {
    renderForgotPassword();
    const gate = deferred();
    forgotPassword.mockReturnValue(gate.promise);

    fillEmail("Sulaimon@Example.com");
    submitEmail();

    expect(screen.getByText("Sending…")).toBeDefined();

    gate.resolve({});
    expect(await screen.findByText("Enter Reset Code")).toBeDefined();
    expect(forgotPassword).toHaveBeenCalledWith({ email: "sulaimon@example.com" });
    // The step echoes the address as typed; normalization (trim/lowercase)
    // happens only in the service payload and the reset hand-off URL.
    expect(screen.getByText("Sulaimon@Example.com")).toBeDefined();
  });

  it("surfaces the server's rate-limit message and stays on the email step", async () => {
    renderForgotPassword();
    forgotPassword.mockRejectedValue({
      response: { status: 429, data: {} },
      config: { url: "/auth/forgot-password" },
    });

    fillEmail("sulaimon@example.com");
    submitEmail();

    expect(
      await screen.findByText("Too many attempts — please wait a moment and try again."),
    ).toBeDefined();
    expect(screen.getByText("Reset Password")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g Bax**re@gmail.com")).toBeDefined();
  });
});

describe("ForgotPassword code step", () => {
  it("hands off to reset-password with the email and the entered code", async () => {
    renderForgotPassword();
    await reachOtpStep();

    typeOtp("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verify Code" }));

    const target = await screen.findByTestId("reset-target");
    expect(target.textContent).toBe("/reset-password?email=sulaimon%40example.com&token=123456");
  });

  it("re-requests a code for the same email on resend", async () => {
    renderForgotPassword();
    await reachOtpStep();

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledTimes(2));
    expect(forgotPassword).toHaveBeenLastCalledWith({ email: "sulaimon@example.com" });
  });

  it("returns to the email step with a fresh state on 'Change email address'", async () => {
    renderForgotPassword();
    await reachOtpStep();

    fireEvent.click(screen.getByRole("button", { name: "← Change email address" }));

    // Back on the email step; the typed address is kept (pre-filled for
    // editing) rather than wiped.
    expect(screen.getByText("Reset Password")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g Bax**re@gmail.com").value).toBe("sulaimon@example.com");
  });
});
