import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OTPStep from "../../../../pages/auth/SignUp/OTPStep";
import { verifyEmail, resendVerification } from "../../../../services/authService";

// The final step of sign-up: verifies the emailed code and hands the session
// back to the orchestrator. Uncovered off the baseline; services mocked at the
// module boundary, countdown/OtpBoxes run for real (deterministic: the code
// window starts at 15 minutes, far beyond test runtime).
vi.mock("../../../../services/authService", () => ({
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
}));

const EMAIL = "sulaimon@example.com";

function renderStep() {
  const onVerified = vi.fn();
  const onBack = vi.fn();
  render(<OTPStep email={EMAIL} onVerified={onVerified} onBack={onBack} />);
  return { onVerified, onBack };
}

function typeCode(code) {
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: code } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Continue|Verifying/ }));
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

describe("OTPStep continue button", () => {
  it("stays disabled until all six digits are entered", () => {
    renderStep();

    expect(screen.getByRole("button", { name: "Continue" }).disabled).toBe(true);

    typeCode("123");
    expect(screen.getByRole("button", { name: "Continue" }).disabled).toBe(true);

    typeCode("123456");
    expect(screen.getByRole("button", { name: "Continue" }).disabled).toBe(false);
  });
});

describe("OTPStep verification", () => {
  it("verifies the code, shows loading, then hands the session to onVerified", async () => {
    const { onVerified } = renderStep();
    const result = { accessToken: "verified-token" };
    const gate = deferred();
    verifyEmail.mockReturnValue(gate.promise);

    typeCode("123456");
    submit();

    expect(verifyEmail).toHaveBeenCalledWith({ email: EMAIL, token: "123456" });
    expect(screen.getByText("Verifying...")).toBeDefined();

    gate.resolve(result);
    await waitFor(() => expect(onVerified).toHaveBeenCalledWith(result));
  });

  it("explains a rejected code inline and does not advance", async () => {
    const { onVerified } = renderStep();
    verifyEmail.mockRejectedValue({
      response: { status: 400, data: { message: "Invalid verification code" } },
    });

    typeCode("654321");
    submit();

    expect(await screen.findByText("Invalid verification code")).toBeDefined();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("resends to the same email, confirms it, and clears the entered code", async () => {
    renderStep();
    resendVerification.mockResolvedValue({});

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(await screen.findByText("A new code has been sent.")).toBeDefined();
    expect(resendVerification).toHaveBeenCalledWith({ email: EMAIL });
    expect(screen.getByLabelText("Verification code").value).toBe("");
  });

  it("surfaces a resend rate-limit failure in the resend message", async () => {
    renderStep();
    resendVerification.mockRejectedValue({
      response: { status: 429, data: {} },
      config: { url: "/auth/register/resend" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(
      await screen.findByText("Too many attempts — please wait a moment and try again."),
    ).toBeDefined();
  });

  it("returns to the previous step on 'Wrong email?'", () => {
    const { onBack } = renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Wrong email?" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
